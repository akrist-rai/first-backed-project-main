import { db, queries, initDatabase } from "../src/db";
import { AuthService, generateShortCode } from "../src/utils";

console.log("🌱 Seeding database...");

async function seed() {
  // Initialize database first
  initDatabase();

  try {
    // Create demo users
    const demoPassword = await AuthService.hashPassword("Demo1234");
    
    queries.createUser.run("demo_user", "demo@example.com", demoPassword);
    queries.createUser.run("alice", "alice@example.com", demoPassword);
    queries.createUser.run("bob", "bob@example.com", demoPassword);

    console.log("✅ Created 3 demo users (password: Demo1234)");

    // Create demo URLs
    const demoUrls = [
      { url: "https://github.com", code: "github", userId: 1 },
      { url: "https://google.com", code: "google", userId: 1 },
      { url: "https://stackoverflow.com", code: "so", userId: 2 },
      { url: "https://reddit.com", code: "reddit", userId: 2 },
      { url: "https://twitter.com", code: "twitter", userId: 3 },
    ];

    for (const demo of demoUrls) {
      queries.createUrl.run(demo.code, demo.url, demo.userId, null);
    }

    // Create some random URLs
    for (let i = 0; i < 10; i++) {
      const code = generateShortCode();
      const urls = [
        "https://example.com",
        "https://test.com",
        "https://demo.com",
      ];
      const randomUrl = urls[Math.floor(Math.random() * urls.length)];
      queries.createUrl.run(code, randomUrl, null, null);
    }

    console.log("✅ Created demo URLs");

    // Simulate some clicks
    for (let i = 1; i <= 5; i++) {
      for (let j = 0; j < Math.floor(Math.random() * 20); j++) {
        queries.incrementClicks.run(i);
        queries.logClick.run(
          i,
          "Mozilla/5.0 (Demo Browser)",
          null,
          "127.0.0.1"
        );
      }
    }

    console.log("✅ Added demo analytics data");
    console.log("\n📋 Demo Users:");
    console.log("  - username: demo_user, password: Demo1234");
    console.log("  - username: alice, password: Demo1234");
    console.log("  - username: bob, password: Demo1234");
    console.log("\n✨ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    db.close();
  }
}

seed();
