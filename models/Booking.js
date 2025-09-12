// server/models/Booking.js
const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  packageId: { type: String, required: true },
  purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
  sessionDate: { type: Date, required: true },
  purchaserEmail: { type: String },
  status: { type: String, default: "booked" }, // booked, confirmed, completed, canceled
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", BookingSchema);
