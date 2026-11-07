import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Order Service MongoDB connected successfully");
  } catch (error) {
    console.error("Order Service MongoDB connection error:", error.message);
    throw error;
  }
}