import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../../lib/mongoose';
import Credit from '../../../../models/Credit';
import Log from '../../../../models/log'; // Import Log model

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  await connect();

  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }
    
    const credit = await Credit.findById(id);
    if (!credit) {
      return res.status(404).json({ error: 'Credit entry not found' });
    }
    
    const amountNum = Number(amount);
    
    // Save the previous values for logging
    const previousValues = {
      amountPaid: credit.amountPaid,
      remainingAmount: credit.remainingAmount
    };
    
    // Add payment to history
    credit.paymentHistory.push({
      amount: amountNum,
      date: new Date()
    });
    
    // Update amount paid and remaining
    credit.amountPaid = credit.amountPaid + amountNum;
    credit.remainingAmount = credit.totalAmount - credit.amountPaid;
    
    // Update isPaid status if fully paid
    if (credit.remainingAmount <= 0) {
      credit.isPaid = true;
    }
    
    // Save changes
    await credit.save();
    
    // Log the payment
    await Log.create({
      type: 'payment',
      description: `Recorded payment of ₹${amountNum} for ${credit.type === 'given' ? 'credit given to' : 'credit taken from'} ${credit.name} (Paid: ₹${credit.amountPaid}, Remaining: ₹${credit.remainingAmount})`,
      timestamp: new Date(),
      relatedItemId: credit._id.toString(),
      relatedItemName: credit.name,
      relatedItemType: 'credit'
    });
    
    return res.status(200).json(credit);
  } catch (error) {
    console.error('Payment error:', error);
    
    // Log the error
    try {
      await Log.create({
        type: 'error',
        description: `Failed to process payment for credit ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return res.status(500).json({ error: 'Failed to process payment' });
  }
}