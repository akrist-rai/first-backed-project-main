import { queries } from "../db";
import { Validator, generateShortCode, successResponse, errorResponse } from "../utils";
import type { Context } from "../middleware";

export class UrlController {
  // Create a shortened URL
  static async createShortUrl(ctx: Context): Promise<Response> {
    const body = (ctx as any).body;
    const { url, customCode, expiresInDays } = body;

    if (!url) {
      return Response.json(errorResponse("URL is required"), { status: 400 });
    }

    if (!Validator.isValidUrl(url)) {
      return Response.json(errorResponse("Invalid URL format"), { status: 400 });
    }

    try {
      // Generate or validate custom short code
      let shortCode = customCode || generateShortCode();

      if (customCode) {
        if (!/^[a-zA-Z0-9_-]{3,20}$/.test(customCode)) {
          return Response.json(
            errorResponse("Custom code must be 3-20 characters, alphanumeric, hyphens, and underscores only"),
            { status: 400 }
          );
        }

        // Check if custom code already exists
        const existing = queries.findUrlByShortCode.get(customCode);
        if (existing) {
          return Response.json(errorResponse("Custom code already exists"), { status: 409 });
        }
      } else {
        // Ensure generated code is unique
        let attempts = 0;
        while (attempts < 10) {
          const existing = queries.findUrlByShortCode.get(shortCode);
          if (!existing) break;
          shortCode = generateShortCode();
          attempts++;
        }

        if (attempts === 10) {
          return Response.json(errorResponse("Failed to generate unique code"), { status: 500 });
        }
      }

      // Calculate expiration date
      let expiresAt = null;
      if (expiresInDays && expiresInDays > 0) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + expiresInDays);
        expiresAt = expirationDate.toISOString();
      }

      // Create URL (can be authenticated or anonymous)
      const userId = ctx.user?.userId || null;
      const result = queries.createUrl.run(shortCode, url, userId, expiresAt);

      const baseUrl = process.env.BASE_URL || "http://localhost:3000";

      return Response.json(
        successResponse(
          {
            shortCode,
            shortUrl: `${baseUrl}/${shortCode}`,
            originalUrl: url,
            expiresAt,
          },
          "URL shortened successfully"
        ),
        { status: 201 }
      );
    } catch (error) {
      console.error("Create short URL error:", error);
      return Response.json(errorResponse("Failed to create short URL"), { status: 500 });
    }
  }

  // Redirect to original URL
  static async redirect(ctx: Context): Promise<Response> {
    const shortCode = ctx.params?.code;

    if (!shortCode) {
      return Response.json(errorResponse("Short code is required"), { status: 400 });
    }

    try {
      const urlRecord = queries.findUrlByShortCode.get(shortCode) as any;

      if (!urlRecord) {
        return new Response("URL not found", { status: 404 });
      }

      // Check if expired
      if (urlRecord.expires_at) {
        const expirationDate = new Date(urlRecord.expires_at);
        if (expirationDate < new Date()) {
          return new Response("URL has expired", { status: 410 });
        }
      }

      // Log analytics
      const userAgent = ctx.req.headers.get("User-Agent") || null;
      const referer = ctx.req.headers.get("Referer") || null;
      const ip = ctx.req.headers.get("x-forwarded-for") || "unknown";

      queries.logClick.run(urlRecord.id, userAgent, referer, ip);
      queries.incrementClicks.run(urlRecord.id);

      // Redirect
      return Response.redirect(urlRecord.original_url, 302);
    } catch (error) {
      console.error("Redirect error:", error);
      return Response.json(errorResponse("Failed to redirect"), { status: 500 });
    }
  }

  // Get user's URLs (requires authentication)
  static async getUserUrls(ctx: Context): Promise<Response> {
    if (!ctx.user) {
      return Response.json(errorResponse("Unauthorized"), { status: 401 });
    }

    try {
      const urls = queries.getUserUrls.all(ctx.user.userId) as any[];

      const baseUrl = process.env.BASE_URL || "http://localhost:3000";

      const formatted = urls.map((url) => ({
        id: url.id,
        shortCode: url.short_code,
        shortUrl: `${baseUrl}/${url.short_code}`,
        originalUrl: url.original_url,
        clicks: url.clicks,
        createdAt: url.created_at,
        expiresAt: url.expires_at,
      }));

      return Response.json(successResponse(formatted));
    } catch (error) {
      console.error("Get user URLs error:", error);
      return Response.json(errorResponse("Failed to get URLs"), { status: 500 });
    }
  }

  // Get URL analytics (requires authentication)
  static async getAnalytics(ctx: Context): Promise<Response> {
    if (!ctx.user) {
      return Response.json(errorResponse("Unauthorized"), { status: 401 });
    }

    const shortCode = ctx.params?.code;

    if (!shortCode) {
      return Response.json(errorResponse("Short code is required"), { status: 400 });
    }

    try {
      const urlRecord = queries.findUrlByShortCode.get(shortCode) as any;

      if (!urlRecord) {
        return Response.json(errorResponse("URL not found"), { status: 404 });
      }

      // Check ownership
      if (urlRecord.user_id !== ctx.user.userId) {
        return Response.json(errorResponse("Unauthorized"), { status: 403 });
      }

      const analytics = queries.getUrlAnalytics.all(urlRecord.id);

      return Response.json(
        successResponse({
          shortCode,
          totalClicks: urlRecord.clicks,
          clicksByDay: analytics,
        })
      );
    } catch (error) {
      console.error("Get analytics error:", error);
      return Response.json(errorResponse("Failed to get analytics"), { status: 500 });
    }
  }

  // Delete URL (requires authentication)
  static async deleteUrl(ctx: Context): Promise<Response> {
    if (!ctx.user) {
      return Response.json(errorResponse("Unauthorized"), { status: 401 });
    }

    const shortCode = ctx.params?.code;

    if (!shortCode) {
      return Response.json(errorResponse("Short code is required"), { status: 400 });
    }

    try {
      const result = queries.deleteUrl.run(shortCode, ctx.user.userId);

      if ((result as any).changes === 0) {
        return Response.json(errorResponse("URL not found or unauthorized"), { status: 404 });
      }

      return Response.json(successResponse(null, "URL deleted successfully"));
    } catch (error) {
      console.error("Delete URL error:", error);
      return Response.json(errorResponse("Failed to delete URL"), { status: 500 });
    }
  }
}
