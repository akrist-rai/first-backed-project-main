import { queries } from "../db";
import { AuthService, Validator, successResponse, errorResponse } from "../utils";
import type { Context } from "../middleware";

export class AuthController {
  // Register a new user
  static async register(ctx: Context): Promise<Response> {
    const body = (ctx as any).body;
    const { username, email, password } = body;

    // Validation
    if (!username || !email || !password) {
      return Response.json(errorResponse("All fields are required"), { status: 400 });
    }

    if (!Validator.isValidUsername(username)) {
      return Response.json(
        errorResponse("Username must be 3-20 characters, alphanumeric and underscores only"),
        { status: 400 }
      );
    }

    if (!Validator.isValidEmail(email)) {
      return Response.json(errorResponse("Invalid email format"), { status: 400 });
    }

    if (!Validator.isValidPassword(password)) {
      return Response.json(
        errorResponse(
          "Password must be at least 8 characters with uppercase, lowercase, and number"
        ),
        { status: 400 }
      );
    }

    try {
      // Check if user exists
      const existingUser = queries.findUserByUsername.get(username);
      if (existingUser) {
        return Response.json(errorResponse("Username already exists"), { status: 409 });
      }

      const existingEmail = queries.findUserByEmail.get(email);
      if (existingEmail) {
        return Response.json(errorResponse("Email already exists"), { status: 409 });
      }

      // Hash password and create user
      const passwordHash = await AuthService.hashPassword(password);
      const result = queries.createUser.run(username, email, passwordHash);

      const userId = (result as any).lastInsertRowid;

      // Generate JWT token
      const token = AuthService.generateToken({ userId, username });

      return Response.json(
        successResponse(
          {
            user: { id: userId, username, email },
            token,
          },
          "User registered successfully"
        ),
        { status: 201 }
      );
    } catch (error) {
      console.error("Registration error:", error);
      return Response.json(errorResponse("Failed to register user"), { status: 500 });
    }
  }

  // Login
  static async login(ctx: Context): Promise<Response> {
    const body = (ctx as any).body;
    const { username, password } = body;

    if (!username || !password) {
      return Response.json(errorResponse("Username and password are required"), {
        status: 400,
      });
    }

    try {
      // Find user
      const user = queries.findUserByUsername.get(username) as any;

      if (!user) {
        return Response.json(errorResponse("Invalid credentials"), { status: 401 });
      }

      // Verify password
      const isValid = await AuthService.verifyPassword(password, user.password_hash);

      if (!isValid) {
        return Response.json(errorResponse("Invalid credentials"), { status: 401 });
      }

      // Generate token
      const token = AuthService.generateToken({
        userId: user.id,
        username: user.username,
      });

      return Response.json(
        successResponse(
          {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
            },
            token,
          },
          "Login successful"
        )
      );
    } catch (error) {
      console.error("Login error:", error);
      return Response.json(errorResponse("Failed to login"), { status: 500 });
    }
  }

  // Get current user profile
  static async getProfile(ctx: Context): Promise<Response> {
    if (!ctx.user) {
      return Response.json(errorResponse("Unauthorized"), { status: 401 });
    }

    try {
      const user = queries.findUserById.get(ctx.user.userId) as any;

      if (!user) {
        return Response.json(errorResponse("User not found"), { status: 404 });
      }

      return Response.json(successResponse(user));
    } catch (error) {
      console.error("Get profile error:", error);
      return Response.json(errorResponse("Failed to get profile"), { status: 500 });
    }
  }
}
