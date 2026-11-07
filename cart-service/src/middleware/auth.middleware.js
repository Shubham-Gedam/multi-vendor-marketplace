import jwt from "jsonwebtoken";
import redis from "../config/redis.js";

export async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Authentication required",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.jti) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid session. Please login again",
      });
    }

    // Verify Redis session
    const sessionData = await redis.get(
      `auth:session:${decoded.jti}`
    );

    if (!sessionData) {
      return res.status(401).json({
        status: "failed",
        message: "Session expired or logged out",
      });
    }

    const session = JSON.parse(sessionData);

    // Verify user details
    if (
      session.userId !== decoded.userId ||
      session.role !== decoded.role
    ) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid session",
      });
    }

    // Only CUSTOMER can access cart
    if (decoded.role !== "CUSTOMER") {
      return res.status(403).json({
        status: "failed",
        message: "Only customers can access the cart",
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
        status: "failed",
        message: "Invalid or expired session",
      });
    }

    console.error("Cart authentication error:", error.message);

    return res.status(503).json({
      status: "failed",
      message: "Authentication service temporarily unavailable",
    });
  }
}
