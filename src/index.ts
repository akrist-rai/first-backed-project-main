import { initDatabase } from "./db";
import { router } from "./routes";
import {
  logger,
  cors,
  errorHandler,
  rateLimit,
  compose,
  type Context,
} from "./middleware";

// Initialize database
initDatabase();

// Global middlewares
const globalMiddlewares = compose(
  errorHandler,
  logger,
  cors,
  rateLimit(
    parseInt(process.env.API_RATE_LIMIT || "100"),
    parseInt(process.env.RATE_LIMIT_WINDOW || "900000")
  )
);

// Create server
const server = Bun.serve({
  port: process.env.PORT || 3000,
  hostname: process.env.HOST || "0.0.0.0",
  
  async fetch(req: Request) {
    const ctx: Context = { req };
    
    // Apply global middlewares and route handler
    return globalMiddlewares(ctx, () => router.handle(ctx));
  },
  
  error(error) {
    console.error("Server error:", error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 URL Shortener API is running!                    ║
║                                                        ║
║   🌐 Server: http://${server.hostname}:${server.port}${" ".repeat(Math.max(0, 27 - server.hostname.length - server.port.toString().length))}║
║   📝 Environment: ${process.env.NODE_ENV || "development"}${" ".repeat(Math.max(0, 36 - (process.env.NODE_ENV || "development").length))}║
║   💾 Database: ${process.env.DATABASE_PATH || "./data/urls.db"}${" ".repeat(Math.max(0, 37 - (process.env.DATABASE_PATH || "./data/urls.db").length))}║
║                                                        ║
║   📚 Documentation: http://${server.hostname}:${server.port}${" ".repeat(Math.max(0, 19 - server.hostname.length - server.port.toString().length))}║
║   ❤️  Health Check: http://${server.hostname}:${server.port}/health${" ".repeat(Math.max(0, 12 - server.hostname.length - server.port.toString().length))}║
║                                                        ║
╚════════════════════════════════════════════════════════╝
`);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down gracefully...");
  process.exit(0);
});
