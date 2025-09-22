// server/controllers/adminController.js
const Purchase = require("../models/Purchase");
const Booking = require("../models/Booking");
const Intake = require("../models/Intake");

async function getPurchases(req, res, next) {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 }).limit(100);
    res.json({ purchases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function getBookings(req, res, next) {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(200).populate("purchaseId");
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function updateBookingStatus(req, res, next) {
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


//Admin Summary for Email Automation
async function adminSummary(req, res, next) {
  try {
    const key = req.headers["x-admin-api-key"] || req.query.adminKey || req.headers.authorization?.replace("Bearer ", "");
    if (!key || key !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Basic summary - adjust query size & filtering in production
    const purchases = await Purchase.find().sort({ createdAt: -1 }).limit(200).lean();
    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(200).lean();
    const intakes = await Intake.find().sort({ createdAt: -1 }).limit(200).lean();

    res.json({ purchases, bookings, intakes });
  } catch (err) {
    console.error("adminSummary error:", err);
    res.status(500).json({ error: "Server error" });
  }
}


module.exports = { getPurchases, getBookings, updateBookingStatus, adminSummary };
