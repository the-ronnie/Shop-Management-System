import mongoose, { Schema } from "mongoose";

const LogSchema = new Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['add', 'buy', 'sell', 'bill', 'credit', 'payment', 'delete', 'update', 'error']
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Changed from a nested object to individual fields to avoid validation issues
  relatedItemId: { type: String, required: false },
  relatedItemName: { type: String, required: false },
  relatedItemType: { type: String, required: false }
});

// Check if model exists to prevent OverwriteModelError during hot reloads
const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);

export default Log;