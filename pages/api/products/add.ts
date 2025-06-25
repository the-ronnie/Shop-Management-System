import connectToDatabase from "../../../lib/mongoose";
import Product from "../../../models/product";
import Log from "../../../models/log"; // Import the Log model
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await connectToDatabase();

  try {
    console.log("Incoming product:", req.body);

    const product = await Product.create(req.body);
    
    // Create a log entry with simplified structure 
    await Log.create({
      type: 'add',
      description: `Product "${product.name}" added with initial quantity ${product.quantity || 0}`,
      timestamp: new Date(),
      // Using individual fields instead of a nested object
      relatedItemId: product._id.toString(),
      relatedItemName: product.name,
      relatedItemType: 'product'
    });

    return res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error: any) {
    console.error("Add Product Error:", error);
    
    // Simplified error logging
    try {
      await Log.create({
        type: 'error',
        description: `Failed to add product: ${error.message}`,
        timestamp: new Date()
        // No relatedItem for errors
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    return res.status(500).json({
      message: "Error adding product",
      error: error.message || "Unknown error",
    });
  }
}