import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../lib/mongoose';
import Credit from '../../../models/Credit';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();

  // GET - fetch credits with filters
  if (req.method === 'GET') {
    const { type, name, phoneNumber, startDate, endDate, sort = 'desc' } = req.query;
    
    const query: any = {};
    
    if (type) query.type = type;
    if (name) query.name = { $regex: name, $options: 'i' };
    if (phoneNumber) query.phoneNumber = { $regex: phoneNumber, $options: 'i' };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }
    
    try {
      const credits = await Credit.find(query).sort({ date: sort === 'desc' ? -1 : 1 });
      return res.status(200).json(credits);
    } catch (error) {
      console.error('Error fetching credits:', error);
      return res.status(500).json({ error: 'Failed to fetch credits' });
    }
  }
  
  // POST - create a new credit entry
  if (req.method === 'POST') {
    try {
      const inputData = req.body;
      console.log('Received credit data:', JSON.stringify(inputData, null, 2));
      
      // Calculate total from items if needed
      const totalAmount = inputData.totalAmount || 
        inputData.items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0);
      
      // Transform the data to match our schema
      const creditData = {
        name: inputData.name,
        phoneNumber: inputData.phone, // Map phone -> phoneNumber
        date: inputData.date,
        totalAmount: totalAmount,
        amountPaid: inputData.amountPaid || 0,
        remainingAmount: totalAmount - (inputData.amountPaid || 0), // Calculate remaining
        images: inputData.images || [],
        type: inputData.type,
        isPaid: false,
        // Transform items to match schema
        items: inputData.items.map((item: any) => ({
          product: new mongoose.Types.ObjectId(), // Generate dummy ID or use ObjectId(null)
          productName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.quantity * item.price
        }))
      };
      
      console.log('Transformed credit data:', JSON.stringify(creditData, null, 2));
      
      const credit = await Credit.create(creditData);
      console.log('Credit created with ID:', credit._id);
      
      return res.status(201).json(credit);
    } catch (error: any) {
      console.error('Create credit error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.message 
        });
      }
      
      return res.status(500).json({ error: 'Failed to create credit entry' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}