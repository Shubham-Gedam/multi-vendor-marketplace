import elasticClient from "./elasticsearch.js";

const INDEX_NAME = "products";

export async function createProductIndex() {
  try {
    const indexExists = await elasticClient.indices.exists({
      index: INDEX_NAME,
    });

    if (indexExists) {
      console.log("Products index already exists");
      return;
    }

    await elasticClient.indices.create({
      index: INDEX_NAME,
      mappings: {
        properties: {
          productId: { type: "keyword" },
          vendorId: { type: "keyword" },

          name: {
            type: "text",
            fields: {
              keyword: { type: "keyword" },
            },
          },
          description: { type: "text" },
          price: { type: "double" },
          category: { type: "keyword" },
          brand: { type: "keyword" },
          images: { type: "keyword" },
          stock: { type: "integer" },
          stock: { type: "integer" },
          averageRating: { type: "double" },
          status: { type: "keyword" },
          status: { type: "keyword" },
          createdAt: { type: "date" },
          updatedAt: { type: "date" },
        },
      },
    });

    console.log("Products Elasticsearch index created successfully");
  } catch (error) {
    console.error("Product index creation error:", error.message);
    throw error;
  }
}
