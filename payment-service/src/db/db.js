import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Payment Service MongoDB connected successfully");
  } catch (error) {
    console.error(
      "Payment Service MongoDB connection error:",
      error.message
    );

    throw error;
  }
}