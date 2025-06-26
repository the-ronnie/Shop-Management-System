import connect from "../../../../lib/mongoose";
import Product from "../../../../models/product";
import Log from "../../../../models/log";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  await connect();

  if (req.method === "DELETE") {
    try {
      // Get the product details before deleting it
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Store product info for the log
      const productName = product.name;
      const productId = product._id.toString();
      
      // Delete the product
      await Product.findByIdAndDelete(id);
      
      // Create a log entry for the deletion
      await Log.create({
        type: 'delete',
        description: `Product "${productName}" was deleted from inventory`,
        timestamp: new Date(),
        relatedItemId: productId,
        relatedItemName: productName,
        relatedItemType: 'product'
      });
      
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting product:", error);
      
      // Log the error
      try {
        await Log.create({
          type: 'error',
          description: `Failed to delete product: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date()
        });
      } catch (logError) {
        console.error("Failed to log error:", logError);
      }
      
      return res.status(500).json({ message: "Error deleting product" });
    }
  }

  res.status(405).json({ message: "Method not allowed" });
}