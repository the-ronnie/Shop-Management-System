import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: String,
  description: String,
  category: String,
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
