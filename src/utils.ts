import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

export interface JwtPayload {
  userId: number;
  username: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  static verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return null;
    }
    
    return parts[1];
  }
}

// Validation utilities
export class Validator {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  }

  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  static isValidUsername(username: string): boolean {
    // 3-20 characters, alphanumeric and underscores only
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  }
}

// Generate random short code
export function generateShortCode(length: number = 6): string {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Response helpers
export function successResponse(data: any, message: string = "Success") {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(message: string, statusCode: number = 400) {
  return {
    success: false,
    error: message,
    statusCode,
  };
}
