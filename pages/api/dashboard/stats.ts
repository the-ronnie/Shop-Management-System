import type { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from "../../../lib/mongoose";
import Product from "../../../models/product";

import Bill from "../../../models/bill";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    
    // Get total products count
    const totalProducts = await Product.countDocuments();
    
    // Get out of stock products count
    const outOfStock = await Product.countDocuments({ quantity: { $lte: 0 } });
    
    // Get total customers count

    
    // Get total sales
    const bills = await Bill.find();
    const totalSales = bills.reduce((sum, bill) => sum + bill.total, 0);
    
    return res.status(200).json({
      totalProducts,
      outOfStock,
      
      totalSales
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
}