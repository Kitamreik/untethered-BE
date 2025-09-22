// server/routes/adminRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const { getPurchases, getBookings, updateBookingStatus, adminSummary } = require("../ctrl/adminCtrl");

//Quick Check
router.get("/", (req, res) => res.json({ status: 200 }));
router.get("/health", adminSummary);

router.get("/purchases", adminAuth, getPurchases);
router.get("/bookings", adminAuth, getBookings);
router.patch("/bookings/:id", adminAuth, updateBookingStatus); //post if not operational

module.exports = router;
