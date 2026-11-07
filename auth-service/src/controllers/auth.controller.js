import userModel from "../models/User.model.js";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import redisClient from "../db/redis.js";

export async function registerController(req, res) {
  const { email, password, name } = req.body;

  const isExsts = await userModel.findOne({ email: email });

  if (isExsts) {
    return res.status(422).json({
      message: "Email already exists, please use a different email address",
      status: "failed",
    });
  }

  const user = await userModel.create({
    email,
    password,
    name,
  });
  const sessionId = randomUUID();

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "3d",
      jwtid: sessionId,
    },
  );

  await redisClient.set(
    `auth:session:${sessionId}`,
    JSON.stringify({
      userId: user._id.toString(),
      role: user.role,
    }),
    {
      EX: 3 * 24 * 60 * 60,
    },
  );

  res.cookie("token", token);

  res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token: token,
    message: "User registered successfully",
    status: "success",
  });
}

export async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found, please register first",
        status: "failed",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
        status: "failed",
      });
    }

    const sessionId = randomUUID();

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
        jwtid: sessionId,
      },
    );

    await redisClient.set(
      `auth:session:${sessionId}`,
      JSON.stringify({
        userId: user._id.toString(),
        role: user.role,
      }),
      {
        EX: 3 * 24 * 60 * 60,
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      message: "User logged in successfully",
      status: "success",
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
      status: "failed",
    });
  }
}

export async function getMeController(req, res) {
  return res.status(200).json({
    status: "success",
    user: req.user,
  });
}

export async function updateUserRoleInternalController(req, res) {
  try {
    const serviceKey = req.headers["x-internal-service-key"];
    console.log(
      "Internal key configured:",
      Boolean(process.env.INTERNAL_SERVICE_KEY),
    );

    console.log("Received key:", Boolean(serviceKey));

    console.log(
      "Internal key matches:",
      serviceKey === process.env.INTERNAL_SERVICE_KEY,
    );

    if (
      !process.env.INTERNAL_SERVICE_KEY ||
      serviceKey !== process.env.INTERNAL_SERVICE_KEY
    ) {
      return res.status(403).json({
        status: "failed",
        message: "Internal service access denied",
      });
    }

    const { userId, role } = req.body;

    if (!userId || !["CUSTOMER", "VENDOR"].includes(role)) {
      return res.status(400).json({
        status: "failed",
        message: "Valid userId and role are required",
      });
    }

    const user = await userModel
      .findByIdAndUpdate(userId, { role }, { new: true, runValidators: true })
      .select("_id name email role");

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Internal role update error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
}

export async function logoutController(req, res) {
  try {
    const token = req.cookies?.token;

    if (token) {
      const decoded = jwt.decode(token);

      if (decoded?.jti) {
        await redisClient.del(
          `auth:session:${decoded.jti}`
        );
      }
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    return res.status(500).json({
      status: "failed",
      message: "Logout failed",
    });
  }
}
