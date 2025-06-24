import mongoose, { Schema, models, model } from "mongoose";

const BillSchema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        lineTotal: {
          type: Number,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default models.Bill || model("Bill", BillSchema);