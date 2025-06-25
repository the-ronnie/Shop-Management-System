import connect from "../../../../lib/mongoose";
import Product from "../../../../models/product";
import Log from "../../../../models/log"; // Changed from LogModel to Log
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  await connect();
  const { id } = req.query;
  const { quantity = 1 } = req.body; // Get quantity from request body, default to 1
  
  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Store previous quantity for logging
    const previousQuantity = product.quantity;
    
    // Add the specified quantity
    product.quantity += Number(quantity);
    await product.save();
    
    // Log the stock increase action - fixed structure to match schema
    await Log.create({
      type: 'buy',
      description: `Added ${quantity} units to product "${product.name}" (Previous: ${previousQuantity}, New: ${product.quantity})`,
      timestamp: new Date(),
      relatedItemId: product._id.toString(),
      relatedItemName: product.name,
      relatedItemType: 'product'
    });
    
    // Fetch the updated product to ensure all fields are included
    const updatedProduct = await Product.findById(id);
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Buy operation failed:", error);
    
    // Log the error
    try {
      await Log.create({
        type: 'error',
        description: `Failed to add stock to product ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
        // No related items for errors
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    res.status(500).json({ message: "Failed to update inventory" });
  }
}