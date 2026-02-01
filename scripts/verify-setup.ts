#!/usr/bin/env bun

/**
 * Setup Verification Script
 * Checks if the project is properly set up and ready to run
 */

console.log("🔍 Verifying URL Shortener Setup...\n");

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function pass(message: string) {
  console.log(`✅ ${message}`);
  checks.passed++;
}

function fail(message: string) {
  console.log(`❌ ${message}`);
  checks.failed++;
}

function warn(message: string) {
  console.log(`⚠️  ${message}`);
  checks.warnings++;
}

function section(title: string) {
  console.log(`\n📋 ${title}`);
  console.log("─".repeat(50));
}

// Check 1: Bun installation
section("Bun Runtime");
try {
  const bunVersion = Bun.version;
  pass(`Bun is installed (version ${bunVersion})`);
} catch (error) {
  fail("Bun is not installed or not working");
}

// Check 2: Node modules
section("Dependencies");
try {
  const fs = require("fs");
  const path = require("path");
  
  if (fs.existsSync("node_modules")) {
    pass("node_modules directory exists");
    
    // Check for critical dependencies
    const criticalDeps = ["bcrypt", "jsonwebtoken"];
    for (const dep of criticalDeps) {
      const depPath = path.join("node_modules", dep);
      if (fs.existsSync(depPath)) {
        pass(`Dependency '${dep}' is installed`);
      } else {
        fail(`Dependency '${dep}' is missing`);
      }
    }
  } else {
    fail("node_modules not found - run 'bun install'");
  }
} catch (error) {
  fail("Error checking dependencies");
}

// Check 3: Environment file
section("Environment Configuration");
try {
  const fs = require("fs");
  
  if (fs.existsSync(".env")) {
    pass(".env file exists");
    
    const envContent = fs.readFileSync(".env", "utf8");
    
    // Check critical env vars
    if (envContent.includes("JWT_SECRET=")) {
      pass("JWT_SECRET is configured");
    } else {
      warn("JWT_SECRET not found in .env");
    }
    
    if (envContent.includes("PORT=")) {
      pass("PORT is configured");
    } else {
      warn("PORT not found in .env");
    }
  } else {
    warn(".env file not found - using defaults");
    console.log("   You can copy .env.example to .env");
  }
} catch (error) {
  warn("Error checking .env file");
}

// Check 4: Data directory
section("Database");
try {
  const fs = require("fs");
  
  if (!fs.existsSync("data")) {
    console.log("   Creating data directory...");
    fs.mkdirSync("data", { recursive: true });
    pass("data directory created");
  } else {
    pass("data directory exists");
  }
  
  // Check if database exists
  if (fs.existsSync("data/urls.db")) {
    pass("Database file exists (data/urls.db)");
  } else {
    warn("Database not initialized - run 'bun run db:migrate'");
  }
} catch (error) {
  fail("Error checking data directory");
}

// Check 5: Source files
section("Source Files");
try {
  const fs = require("fs");
  const criticalFiles = [
    "src/index.ts",
    "src/db.ts",
    "src/routes.ts",
    "src/utils.ts",
    "src/middleware/index.ts",
    "src/controllers/auth.controller.ts",
    "src/controllers/url.controller.ts",
  ];
  
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      pass(`${file}`);
    } else {
      fail(`${file} is missing`);
    }
  }
} catch (error) {
  fail("Error checking source files");
}

// Check 6: Port availability
section("Port Availability");
try {
  const port = process.env.PORT || 3000;
  console.log(`   Checking if port ${port} is available...`);
  
  const server = Bun.serve({
    port: Number(port),
    fetch() {
      return new Response("test");
    },
  });
  
  server.stop();
  pass(`Port ${port} is available`);
} catch (error: any) {
  if (error.code === "EADDRINUSE") {
    warn(`Port ${process.env.PORT || 3000} is already in use`);
    console.log("   You can change the port in .env or kill the process using it");
  } else {
    warn("Could not verify port availability");
  }
}

// Summary
section("Summary");
console.log(`\n📊 Results:`);
console.log(`   ✅ Passed: ${checks.passed}`);
console.log(`   ❌ Failed: ${checks.failed}`);
console.log(`   ⚠️  Warnings: ${checks.warnings}`);

if (checks.failed === 0 && checks.warnings === 0) {
  console.log(`\n🎉 All checks passed! You're ready to go!`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Initialize database: bun run db:migrate`);
  console.log(`   2. (Optional) Seed data: bun run db:seed`);
  console.log(`   3. Start server: bun run dev`);
  console.log(`   4. Visit: http://localhost:${process.env.PORT || 3000}`);
} else if (checks.failed === 0) {
  console.log(`\n✅ Setup is mostly complete with some warnings.`);
  console.log(`   Review warnings above and fix if needed.`);
  console.log(`\n🚀 You can still start the server with: bun run dev`);
} else {
  console.log(`\n⚠️  Setup has issues that need to be fixed.`);
  console.log(`   Review the failed checks above.`);
  console.log(`\n💡 Common fixes:`);
  console.log(`   - Run: bun install`);
  console.log(`   - Copy: cp .env.example .env`);
  console.log(`   - Check: TROUBLESHOOTING.md`);
}

console.log("\n");
