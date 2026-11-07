import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API Gateway is running",
  });
});

// Microservices configuration
const services = [
  {
    name: "Auth Service",
    prefix: "/api/auth",
    target: process.env.AUTH_SERVICE_URL,
  },
  {
    name: "Vendor Service",
    prefix: "/api/vendors",
    target: process.env.VENDOR_SERVICE_URL,
  },
  {
    name: "Product Service",
    prefix: "/api/products",
    target: process.env.PRODUCT_SERVICE_URL,
  },
  {
    name: "Cart Service",
    prefix: "/api/cart",
    target: process.env.CART_SERVICE_URL,
  },
  {
    name: "Order Service",
    prefix: "/api/orders",
    target: process.env.ORDER_SERVICE_URL,
  },
  {
    name: "Payment Service",
    prefix: "/api/payments",
    target: process.env.PAYMENT_SERVICE_URL,
  },
];

// Configure proxy for each microservice
services.forEach(({ name, prefix, target }) => {
  app.use(
    createProxyMiddleware({
      target,
      changeOrigin: true,

      // Match the complete API prefix
      pathFilter: (pathname) =>
        pathname === prefix || pathname.startsWith(`${prefix}/`),

      // Handle service connection errors
      on: {
        error: (error, req, res) => {
          console.error(`${name} Proxy Error:`, error.message);

          if (!res.headersSent) {
            res.writeHead(502, {
              "Content-Type": "application/json",
            });

            res.end(
              JSON.stringify({
                status: "error",
                message: `${name} is currently unavailable`,
              })
            );
          }
        },
      },
    })
  );
});

// Invalid route handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "API Gateway route not found",
  });
});

export default app;