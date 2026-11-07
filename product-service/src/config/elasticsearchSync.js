import elasticClient from "../config/elasticsearch.js";
import ProductModel from "../models/Product.model.js";

const INDEX_NAME = "products";

export async function syncProductToElastic(product) {
  try {
    await elasticClient.index({
      index: INDEX_NAME,
      id: product._id.toString(),
      document: {
        productId: product._id.toString(),
        vendorId: product.vendorId,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        brand: product.brand || "",
        images: product.images || [],
        stock: product.stock,
        status: product.status,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        stock: product.stock,
        averageRating: product.averageRating || 0,
        status: product.status,
      },
      refresh: "wait_for",
    });
  } catch (error) {
    console.error("Elasticsearch product sync error:", error.message);
    throw error;
  }
}

export async function deleteProductFromElastic(productId) {
  try {
    await elasticClient.delete({
      index: INDEX_NAME,
      id: productId.toString(),
      refresh: "wait_for",
    });
  } catch (error) {
    if (error.meta?.statusCode !== 404) {
      console.error("Elasticsearch product delete error:", error.message);
      throw error;
    }
  }
}

export async function syncAllProductsToElastic() {
  try {
    const products = await ProductModel.find();

    if (products.length === 0) {
      console.log("No products found to sync");
      return;
    }

    const operations = products.flatMap((product) => [
      {
        index: {
          _index: INDEX_NAME,
          _id: product._id.toString(),
        },
      },
      {
        productId: product._id.toString(),
        vendorId: product.vendorId,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        brand: product.brand || "",
        images: product.images || [],
        stock: product.stock,
        status: product.status,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        stock: product.stock,
        averageRating: product.averageRating || 0,
        status: product.status,
      },
    ]);

    const response = await elasticClient.bulk({
      operations,
      refresh: true,
    });

    if (response.errors) {
      console.error("Some products failed to sync");
    }

    console.log(`${products.length} products processed for Elasticsearch sync`);
  } catch (error) {
    console.error("Bulk product sync error:", error.message);
    throw error;
  }
}
