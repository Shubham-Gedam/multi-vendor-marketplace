import express from "express";
import cookieParser from "cookie-parser";
import orderRoutes from "./routes/order.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Order Service is running",
  });
});

app.use("/api/orders", orderRoutes);

export default app;