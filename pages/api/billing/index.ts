import connect from "../../../lib/mongoose";
import BillModel from "../../../models/bill";
import Log from "../../../models/log"; // Import Log model
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();

  // POST request - create a new bill
  if (req.method === 'POST') {
    try {
      const data = req.body;
      
      // Validate required fields
      if (!data.customerName) {
        return res.status(400).json({ message: "Customer name is required" });
      }
      
      if (!data.items || data.items.length === 0) {
        return res.status(400).json({ message: "Bill must contain at least one item" });
      }

      // Create new bill
      const bill = await BillModel.create({
        customerName: data.customerName,
        date: data.date || new Date(),
        items: data.items,
        total: data.total,
      });

      // Log the successful bill creation
      await Log.create({
        type: 'bill',
        description: `Created bill of ₹${bill.total} for customer ${bill.customerName} with ${bill.items.length} items`,
        timestamp: new Date(),
        relatedItemId: bill._id.toString(),
        relatedItemName: bill.customerName,
        relatedItemType: 'bill'
      });

      return res.status(201).json(bill);
    } catch (error) {
      console.error("Error creating bill:", error);
      
      // Log the error
      try {
        await Log.create({
          type: 'error',
          description: `Failed to create bill: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        });
      } catch (logError) {
        console.error("Failed to log error:", logError);
      }
      
      return res.status(500).json({ message: "Failed to create bill" });
    }
  }
  
  // GET request - fetch all bills
  else if (req.method === 'GET') {
    try {
      const bills = await BillModel.find().sort({ date: -1 });
      return res.status(200).json(bills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      
      // Log the error (optional for GET requests)
      try {
        await Log.create({
          type: 'error',
          description: `Failed to fetch bills: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        });
      } catch (logError) {
        console.error("Failed to log error:", logError);
      }
      
      return res.status(500).json({ message: "Failed to fetch bills" });
    }
  }
  
  // Method not allowed
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}