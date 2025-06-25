import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../../lib/mongoose';
import Credit from '../../../../models/Credit';
import Log from '../../../../models/log'; // Import Log model

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  await connect();

  // GET - fetch a single credit
  if (req.method === 'GET') {
    try {
      const credit = await Credit.findById(id);
      if (!credit) {
        return res.status(404).json({ error: 'Credit entry not found' });
      }
      return res.status(200).json(credit);
    } catch (error) {
      console.error('Error fetching credit:', error);
      
      // Log the error
      try {
        await Log.create({
          type: 'error',
          description: `Failed to fetch credit ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
      
      return res.status(500).json({ error: 'Failed to fetch credit entry' });
    }
  }
  
  // PUT - update a credit
  if (req.method === 'PUT') {
    try {
      const updateData = req.body;
      const credit = await Credit.findById(id);
      
      if (!credit) {
        return res.status(404).json({ error: 'Credit entry not found' });
      }
      
      // Store the old values for logging
      const oldValues = {
        name: credit.name,
        amount: credit.totalAmount,
        type: credit.type
      };
      
      // Update the credit
      const updatedCredit = await Credit.findByIdAndUpdate(id, updateData, { new: true });
      
      // Log the update
      await Log.create({
        type: 'update',
        description: `Updated credit for ${oldValues.name}, changed amount from ₹${oldValues.amount} to ₹${updatedCredit.totalAmount}`,
        timestamp: new Date(),
        relatedItemId: updatedCredit._id.toString(),
        relatedItemName: updatedCredit.name,
        relatedItemType: 'credit'
      });
      
      return res.status(200).json(updatedCredit);
    } catch (error) {
      console.error('Error updating credit:', error);
      
      // Log the error
      try {
        await Log.create({
          type: 'error',
          description: `Failed to update credit ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
      
      return res.status(500).json({ error: 'Failed to update credit entry' });
    }
  }
  
  // DELETE - delete a credit
  if (req.method === 'DELETE') {
    try {
      const credit = await Credit.findById(id);
      
      if (!credit) {
        return res.status(404).json({ error: 'Credit entry not found' });
      }
      
      // Store info for logging before deletion
      const creditInfo = {
        id: credit._id.toString(),
        name: credit.name,
        amount: credit.totalAmount,
        type: credit.type
      };
      
      // Delete the credit
      await Credit.findByIdAndDelete(id);
      
      // Log the deletion
      await Log.create({
        type: 'delete',
        description: `Deleted ${creditInfo.type} credit of ₹${creditInfo.amount} for ${creditInfo.name}`,
        timestamp: new Date(),
        relatedItemId: creditInfo.id,
        relatedItemName: creditInfo.name,
        relatedItemType: 'credit'
      });
      
      return res.status(200).json({ message: 'Credit entry deleted successfully' });
    } catch (error) {
      console.error('Error deleting credit:', error);
      
      // Log the error
      try {
        await Log.create({
          type: 'error',
          description: `Failed to delete credit ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
      
      return res.status(500).json({ error: 'Failed to delete credit entry' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}