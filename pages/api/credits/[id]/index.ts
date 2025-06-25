import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../../lib/mongoose';
import Credit from '../../../../models/Credit';

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
      return res.status(500).json({ error: 'Failed to fetch credit entry' });
    }
  }
  
  // PUT - update a credit
  if (req.method === 'PUT') {
    try {
      const credit = await Credit.findByIdAndUpdate(id, req.body, { new: true });
      if (!credit) {
        return res.status(404).json({ error: 'Credit entry not found' });
      }
      return res.status(200).json(credit);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update credit entry' });
    }
  }
  
  // DELETE - delete a credit
  if (req.method === 'DELETE') {
    try {
      const credit = await Credit.findByIdAndDelete(id);
      if (!credit) {
        return res.status(404).json({ error: 'Credit entry not found' });
      }
      return res.status(200).json({ message: 'Credit entry deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete credit entry' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}