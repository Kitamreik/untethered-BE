// server/controllers/adminController.js
const Purchase = require("../models/Purchase");
const Booking = require("../models/Booking");

async function getPurchases(req, res) {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 }).limit(100);
    res.json({ purchases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function getBookings(req, res) {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(200).populate("purchaseId");
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function updateBookingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { getPurchases, getBookings, updateBookingStatus };
