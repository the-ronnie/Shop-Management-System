import connect from "../../../lib/mongoose";
import Log from "../../../models/log";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connect();

  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const search = req.query.search as string;
    
    // Build query
    const query: any = {};
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        // Set the end date to the end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }
    
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }
    
    // Calculate pagination
    const totalLogs = await Log.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / limit);
    
    // Fetch logs with pagination
    const logs = await Log.find(query)
      .sort({ timestamp: -1 }) // Most recent first
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      logs,
      page,
      totalPages,
      totalLogs
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
}