import { initDatabase } from "../src/db";

console.log("🔄 Running database migrations...");

try {
  initDatabase();
  console.log("✅ Database migrations completed successfully!");
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}
