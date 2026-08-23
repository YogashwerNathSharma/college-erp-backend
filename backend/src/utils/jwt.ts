import jwt from "jsonwebtoken";

// ⚡ Token expiry — configurable via environment variable
// Default: 1 hour | Set JWT_EXPIRES_IN in .env to customize (e.g. "2h", "7d", "30m")
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || "1h";
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

// Access token (default: 1 hour)
export const generateToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

// Long-lived refresh token (default: 30 days)
export const generateRefreshToken = (payload: any) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
  return jwt.sign(payload, secret, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

export const verifyRefreshToken = (token: string) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
  return jwt.verify(token, secret);
};
