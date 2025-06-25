
import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../../lib/mongoose';
import Credit from '../../../../models/Credit';

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
    
    // Add payment to history
    credit.paymentHistory.push({
      amount: Number(amount),
      date: new Date()
    });
    
    // Update amount paid and remaining
    credit.amountPaid = credit.amountPaid + Number(amount);
    credit.remainingAmount = credit.totalAmount - credit.amountPaid;
    
    // Save changes
    await credit.save();
    
    return res.status(200).json(credit);
  } catch (error) {
    console.error('Payment error:', error);
    return res.status(500).json({ error: 'Failed to process payment' });
  }
}