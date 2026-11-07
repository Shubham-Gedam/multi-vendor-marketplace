import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/db/db.js";
import { connectRedis } from "./src/db/redis.js";

await connectDB();
await connectRedis();

app.listen(3006, () => {
  console.log("Payment Service is running on port 3006");
});