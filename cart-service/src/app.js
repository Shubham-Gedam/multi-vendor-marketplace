import express from "express";
import cookieParser from "cookie-parser";
import cartRoutes from "./routes/cart.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Cart Service is running",
  });
});

app.use("/api/cart", cartRoutes);

export default app;