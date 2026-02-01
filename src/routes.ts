import type { Context, Handler, Middleware } from "./middleware";
import { compose, authenticate, jsonParser } from "./middleware";
import { AuthController } from "./controllers/auth.controller";
import { UrlController } from "./controllers/url.controller";

interface Route {
  method: string;
  path: string;
  handler: Handler;
  middlewares?: Middleware[];
}

export class Router {
  private routes: Route[] = [];

  add(method: string, path: string, handler: Handler, middlewares: Middleware[] = []) {
    this.routes.push({ method, path, handler, middlewares });
  }

  get(path: string, handler: Handler, middlewares: Middleware[] = []) {
    this.add("GET", path, handler, middlewares);
  }

  post(path: string, handler: Handler, middlewares: Middleware[] = []) {
    this.add("POST", path, handler, middlewares);
  }

  put(path: string, handler: Handler, middlewares: Middleware[] = []) {
    this.add("PUT", path, handler, middlewares);
  }

  delete(path: string, handler: Handler, middlewares: Middleware[] = []) {
    this.add("DELETE", path, handler, middlewares);
  }

  match(method: string, pathname: string): { route: Route; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const params = this.matchPath(route.path, pathname);
      if (params !== null) {
        return { route, params };
      }
    }
    return null;
  }

  private matchPath(pattern: string, pathname: string): Record<string, string> | null {
    const patternParts = pattern.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(":")) {
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        return null;
      }
    }

    return params;
  }

  async handle(ctx: Context): Promise<Response> {
    const url = new URL(ctx.req.url);
    const match = this.match(ctx.req.method, url.pathname);

    if (!match) {
      return Response.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    ctx.params = match.params;

    // Compose route-specific middlewares with the handler
    const middlewares = match.route.middlewares || [];
    const handler = match.route.handler;

    if (middlewares.length === 0) {
      return handler(ctx);
    }

    const composed = compose(...middlewares);
    return composed(ctx, () => handler(ctx));
  }
}

// Create and configure router
export const router = new Router();

// Health check
router.get("/health", async () => {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Auth routes
router.post("/api/auth/register", AuthController.register, [jsonParser]);
router.post("/api/auth/login", AuthController.login, [jsonParser]);
router.get("/api/auth/profile", AuthController.getProfile, [authenticate]);

// URL routes (public)
router.post("/api/urls", UrlController.createShortUrl, [jsonParser]);

// URL routes (authenticated)
router.get("/api/urls", UrlController.getUserUrls, [authenticate]);
router.get("/api/urls/:code/analytics", UrlController.getAnalytics, [authenticate]);
router.delete("/api/urls/:code", UrlController.deleteUrl, [authenticate]);

// Redirect route (must be last to avoid conflicts)
router.get("/:code", UrlController.redirect);

// API documentation route
router.get("/", async () => {
  return new Response(
    `
<!DOCTYPE html>
<html>
<head>
  <title>URL Shortener API</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #333; }
    .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .method { font-weight: bold; color: #0066cc; }
    code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>🔗 URL Shortener API</h1>
  <p>A production-ready URL shortener with authentication and analytics.</p>
  
  <h2>Authentication Endpoints</h2>
  <div class="endpoint">
    <span class="method">POST</span> <code>/api/auth/register</code>
    <p>Register a new user. Body: { username, email, password }</p>
  </div>
  
  <div class="endpoint">
    <span class="method">POST</span> <code>/api/auth/login</code>
    <p>Login. Body: { username, password }</p>
  </div>
  
  <div class="endpoint">
    <span class="method">GET</span> <code>/api/auth/profile</code>
    <p>Get current user profile (requires authentication)</p>
  </div>
  
  <h2>URL Endpoints</h2>
  <div class="endpoint">
    <span class="method">POST</span> <code>/api/urls</code>
    <p>Create short URL. Body: { url, customCode?, expiresInDays? }</p>
  </div>
  
  <div class="endpoint">
    <span class="method">GET</span> <code>/api/urls</code>
    <p>Get user's URLs (requires authentication)</p>
  </div>
  
  <div class="endpoint">
    <span class="method">GET</span> <code>/api/urls/:code/analytics</code>
    <p>Get URL analytics (requires authentication)</p>
  </div>
  
  <div class="endpoint">
    <span class="method">DELETE</span> <code>/api/urls/:code</code>
    <p>Delete URL (requires authentication)</p>
  </div>
  
  <div class="endpoint">
    <span class="method">GET</span> <code>/:code</code>
    <p>Redirect to original URL</p>
  </div>
  
  <h2>System Endpoints</h2>
  <div class="endpoint">
    <span class="method">GET</span> <code>/health</code>
    <p>Health check endpoint</p>
  </div>
</body>
</html>
    `,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
});
