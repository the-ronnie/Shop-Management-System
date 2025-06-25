import connectToDatabase from "../../../lib/mongoose";
import Product from "../../../models/product";
import Log from "../../../models/log"; // Import the Log model
import type { NextApiRequest, NextApiResponse } from "next";

// Helper function to ensure image URLs are stored as absolute URLs
function ensureAbsoluteUrl(url: string): string {
  if (!url) return "";
  
  // If it's already an absolute URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it starts with slash, make it absolute
  if (url.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}${url}`;
  }
  
  // Otherwise, make it absolute with leading slash
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/${url}`;
}

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

    // Process the image URL to ensure it's an absolute URL
    const productData = {
      ...req.body,
      image: ensureAbsoluteUrl(req.body.image)
    };

    // Log the processed product data
    console.log("Processed product data:", productData);
    
    // Create the product with the processed data
    const product = await Product.create(productData);
    
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