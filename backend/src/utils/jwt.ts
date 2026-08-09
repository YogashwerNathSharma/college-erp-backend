import jwt from "jsonwebtoken";

// Short-lived access token (15 minutes)
export const generateToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
};

// Long-lived refresh token (30 days) — falls back to JWT_SECRET if JWT_REFRESH_SECRET not set
export const generateRefreshToken = (payload: any) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
  return jwt.sign(payload, secret, {
    expiresIn: "30d",
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

export const verifyRefreshToken = (token: string) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
  return jwt.verify(token, secret);
};
