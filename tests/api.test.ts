import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { initDatabase, db, queries } from "../src/db";

const BASE_URL = "http://localhost:3000";
let authToken: string;
let testShortCode: string;

// Test data
const testUser = {
  username: "testuser",
  email: "test@example.com",
  password: "Test1234",
};

beforeAll(async () => {
  // Initialize test database
  process.env.DATABASE_PATH = ":memory:";
  initDatabase();
});

afterAll(() => {
  db.close();
});

describe("Health Check", () => {
  test("GET /health should return OK", async () => {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
  });
});

describe("Authentication", () => {
  test("POST /api/auth/register should create a new user", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.user.username).toBe(testUser.username);
    expect(data.data.token).toBeDefined();
  });

  test("POST /api/auth/register should fail with duplicate username", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
  });

  test("POST /api/auth/register should validate email format", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testuser2",
        email: "invalid-email",
        password: "Test1234",
      }),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain("email");
  });

  test("POST /api/auth/login should authenticate user", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password,
      }),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.token).toBeDefined();
    
    // Store token for authenticated tests
    authToken = data.data.token;
  });

  test("POST /api/auth/login should fail with wrong password", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUser.username,
        password: "WrongPassword",
      }),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  test("GET /api/auth/profile should return user profile", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.username).toBe(testUser.username);
  });

  test("GET /api/auth/profile should fail without token", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/profile`);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

describe("URL Shortening", () => {
  test("POST /api/urls should create short URL", async () => {
    const response = await fetch(`${BASE_URL}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.shortCode).toBeDefined();
    expect(data.data.shortUrl).toContain(data.data.shortCode);
    
    testShortCode = data.data.shortCode;
  });

  test("POST /api/urls should create short URL with custom code", async () => {
    const customCode = "mycustom";
    const response = await fetch(`${BASE_URL}/api/urls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        url: "https://example.com/custom",
        customCode,
      }),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.data.shortCode).toBe(customCode);
  });

  test("POST /api/urls should validate URL format", async () => {
    const response = await fetch(`${BASE_URL}/api/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "not-a-valid-url" }),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain("URL");
  });

  test("GET /:code should redirect to original URL", async () => {
    const response = await fetch(`${BASE_URL}/${testShortCode}`, {
      redirect: "manual",
    });
    
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com");
  });

  test("GET /:code should return 404 for non-existent code", async () => {
    const response = await fetch(`${BASE_URL}/nonexistent`, {
      redirect: "manual",
    });
    
    expect(response.status).toBe(404);
  });

  test("GET /api/urls should return user's URLs", async () => {
    const response = await fetch(`${BASE_URL}/api/urls`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("GET /api/urls/:code/analytics should return analytics", async () => {
    const response = await fetch(`${BASE_URL}/api/urls/mycustom/analytics`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.shortCode).toBe("mycustom");
    expect(data.data.totalClicks).toBeGreaterThanOrEqual(0);
  });

  test("DELETE /api/urls/:code should delete URL", async () => {
    const response = await fetch(`${BASE_URL}/api/urls/mycustom`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("Rate Limiting", () => {
  test("Should enforce rate limits", async () => {
    const promises = [];
    
    // Make more requests than the limit
    for (let i = 0; i < 105; i++) {
      promises.push(
        fetch(`${BASE_URL}/health`).then(r => r.status)
      );
    }
    
    const statuses = await Promise.all(promises);
    const rateLimited = statuses.filter(s => s === 429).length;
    
    expect(rateLimited).toBeGreaterThan(0);
  });
});

describe("Middleware", () => {
  test("CORS headers should be present", async () => {
    const response = await fetch(`${BASE_URL}/health`);
    
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeDefined();
  });

  test("OPTIONS request should return CORS headers", async () => {
    const response = await fetch(`${BASE_URL}/api/urls`, {
      method: "OPTIONS",
    });
    
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBeDefined();
  });
});
