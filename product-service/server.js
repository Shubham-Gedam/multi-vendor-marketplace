import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/db/db.js";
import { connectRedis } from "./src/db/redis.js";

import elasticClient from "./src/config/elasticsearch.js";
import { createProductIndex } from "./src/config/productIndex.js";
import { syncAllProductsToElastic } from "./src/config/elasticsearchSync.js";

try {
  await connectDB();
  await connectRedis();

  const health = await elasticClient.cluster.health();

  await createProductIndex();
  await syncAllProductsToElastic();

  app.listen(3003, () => {
    console.log("Server is running on port 3003");
  });
} catch (error) {
  console.error("Server startup error:", error.message);
  process.exit(1);
}