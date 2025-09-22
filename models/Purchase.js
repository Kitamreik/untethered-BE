// server/models/Purchase.js
const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema({
  packageId: { type: String, required: true },
  packageName: { type: String, required: true },
  amount: { type: Number, required: true }, // cents
  currency: { type: String, default: "usd" },
  customerEmail: { type: String },
  stripePaymentIntentId: { type: String, required: true, unique: true },  
  metadata: { type: Object },
  status: { type: String, default: "succeeded" }, // or 'pending', 'failed'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Purchases", PurchaseSchema);
