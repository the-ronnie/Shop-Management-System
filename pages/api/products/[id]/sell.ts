import connect from "../../../../lib/mongoose";
import Product from "../../../../models/product";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  await connect();
  const { id } = req.query;
  const { quantity = 1 } = req.body; // Get quantity from request body, default to 1
  
  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    // Subtract the specified quantity
    product.quantity -= Number(quantity);
    await product.save();
    
    // Fetch the updated product to ensure all fields are included
    const updatedProduct = await Product.findById(id);
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Sell operation failed:", error);
    res.status(500).json({ message: "Failed to update inventory" });
  }
}