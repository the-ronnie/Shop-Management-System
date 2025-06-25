import mongoose, { Schema } from "mongoose";

const CreditItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
});

const CreditSchema = new Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  date: { type: Date, default: Date.now },
  items: [CreditItemSchema],
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },
  images: [String], // URLs to stored images
  type: { type: String, enum: ['given', 'taken'], required: true },
  isPaid: { type: Boolean, default: false },
  paymentHistory: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Update isPaid status when amountPaid changes
CreditSchema.pre('save', function(next) {
  // Update remainingAmount
  this.remainingAmount = this.totalAmount - this.amountPaid;
  
  // Update isPaid status
  if (this.amountPaid >= this.totalAmount) {
    this.isPaid = true;
  } else {
    this.isPaid = false;
  }
  next();
});

const Credit = mongoose.models.Credit || mongoose.model('Credit', CreditSchema);
export default Credit;