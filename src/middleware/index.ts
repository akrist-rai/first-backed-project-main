import type { Server } from "bun";
import { AuthService } from "../utils";

export interface Context {
  req: Request;
  user?: {
    userId: number;
    username: string;
  };
  params?: Record<string, string>;
}

export type Handler = (ctx: Context) => Promise<Response> | Response;
export type Middleware = (ctx: Context, next: () => Promise<Response>) => Promise<Response>;

// Logger middleware
export const logger: Middleware = async (ctx, next) => {
  const start = Date.now();
  const { method, url } = ctx.req;
  
  console.log(`→ ${method} ${url}`);
  
  const response = await next();
  const duration = Date.now() - start;
  
  console.log(`← ${method} ${url} ${response.status} (${duration}ms)`);
  
  return response;
};

// CORS middleware
export const cors: Middleware = async (ctx, next) => {
  const origin = process.env.CORS_ORIGIN || "*";
  
  if (ctx.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  
  const response = await next();
  
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

// Authentication middleware
export const authenticate: Middleware = async (ctx, next) => {
  const authHeader = ctx.req.headers.get("Authorization");
  const token = AuthService.extractTokenFromHeader(authHeader);
  
  if (!token) {
    return new Response(
      JSON.stringify({ success: false, error: "No token provided" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  const payload = AuthService.verifyToken(token);
  
  if (!payload) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid or expired token" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  ctx.user = {
    userId: payload.userId,
    username: payload.username,
  };
  
  return next();
};

// Rate limiting middleware (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): Middleware => {
  return async (ctx, next) => {
    const ip = ctx.req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    
    const record = rateLimitStore.get(ip);
    
    if (record && now < record.resetAt) {
      if (record.count >= maxRequests) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Too many requests. Please try again later.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(record.resetAt).toISOString(),
            },
          }
        );
      }
      
      record.count++;
    } else {
      rateLimitStore.set(ip, {
        count: 1,
        resetAt: now + windowMs,
      });
    }
    
    return next();
  };
};

// Error handling middleware
export const errorHandler: Middleware = async (ctx, next) => {
  try {
    return await next();
  } catch (error) {
    console.error("Error:", error);
    
    const message = error instanceof Error ? error.message : "Internal server error";
    
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// JSON body parser middleware
export const jsonParser: Middleware = async (ctx, next) => {
  if (ctx.req.method !== "GET" && ctx.req.method !== "DELETE") {
    const contentType = ctx.req.headers.get("Content-Type");
    if (contentType?.includes("application/json")) {
      try {
        const body = await ctx.req.json();
        (ctx as any).body = body;
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid JSON body",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
  }
  
  return next();
};

// Compose multiple middlewares
export function compose(...middlewares: Middleware[]): Middleware {
  return async (ctx, next) => {
    let index = -1;
    
    async function dispatch(i: number): Promise<Response> {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      
      index = i;
      
      if (i === middlewares.length) {
        return next();
      }
      
      const middleware = middlewares[i];
      return middleware(ctx, () => dispatch(i + 1));
    }
    
    return dispatch(0);
  };
}
