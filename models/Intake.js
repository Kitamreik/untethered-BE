const mongoose = require("mongoose");

const IntakeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  services: { type: String, required: true },
  tier: { type: String, required: true },
  questions: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Clients", IntakeSchema);
