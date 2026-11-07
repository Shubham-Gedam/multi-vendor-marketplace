import jwt from "jsonwebtoken";
import redisClient from "../db/redis.js";

export async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Please login first",
        status: "failed",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.jti) {
      return res.status(401).json({
        message: "Invalid session. Please login again",
        status: "failed",
      });
    }

    // Verify Redis session
    const sessionData = await redisClient.get(
      `auth:session:${decoded.jti}`
    );

    if (!sessionData) {
      return res.status(401).json({
        message: "Session expired or logged out. Please login again",
        status: "failed",
      });
    }

    const session = JSON.parse(sessionData);

    // Verify session user details
    if (
      session.userId !== decoded.userId ||
      session.role !== decoded.role
    ) {
      return res.status(401).json({
        message: "Invalid session",
        status: "failed",
      });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error instanceof SyntaxError
    ) {
      return res.status(401).json({
        message: "Invalid or expired session. Please login again",
        status: "failed",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(503).json({
      message: "Authentication service is temporarily unavailable",
      status: "failed",
    });
  }
}