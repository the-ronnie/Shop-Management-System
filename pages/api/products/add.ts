import connectToDatabase from "../../../lib/mongoose";
import Product from "../../../models/product";
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

    return res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error: any) {
    console.error("Add Product Error:", error);
    return res.status(500).json({
      message: "Error adding product",
      error: error.message || "Unknown error",
    });
  }
}
