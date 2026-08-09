import { Request, Response } from "express";
import { generateToken, verifyRefreshToken } from "../../utils/jwt";

/**
 * Refresh Token Handler
 * 
 * Frontend sends expired access token scenario:
 * 1. Client detects 401 (access token expired)
 * 2. Client calls POST /api/auth/refresh-token with { refreshToken }
 * 3. Server verifies refresh token, issues new short-lived access token
 * 
 * This avoids forcing re-login every 15 minutes while keeping
 * access tokens short-lived for security.
 */
export const refreshTokenHandler = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken) as {
      userId: string;
      tenantId: string;
      role: string;
    };

    // Generate new short-lived access token
    const newAccessToken = generateToken({
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    });

    return res.json({
      success: true,
      token: newAccessToken,
    });

  } catch (error: any) {
    // If refresh token is also expired/invalid, force re-login
    return res.status(401).json({
      success: false,
      message: "Refresh token expired or invalid. Please login again.",
    });
  }
};
