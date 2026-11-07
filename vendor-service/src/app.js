import express from "express";
import cookieParser from "cookie-parser";
import vendorRoutes from "./routes/vender.route.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Vendor Service is running",
  });
});

// Vendor routes
app.use("/api/vendors", vendorRoutes);

export default app;