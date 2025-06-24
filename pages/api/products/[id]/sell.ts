import connect from "../../../../lib/mongoose";
import Product from "../../../../models/product";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  await connect();
  const { id } = req.query;

  const product = await Product.findById(id);
  if (!product || product.quantity === 0) return res.status(400).json({ message: "Out of stock" });

  product.quantity -= 1;
  await product.save();
  res.status(200).json(product);
}
