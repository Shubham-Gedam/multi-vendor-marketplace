import "dotenv/config";
import app from "./src/app.js";
import redis from "./src/config/redis.js";


try {

  await redis.ping();

  app.listen(3004, () => {
    console.log("Cart Service is running on port 3004");
  });

} catch (error) {
  console.error("Cart Service startup error:", error);
}