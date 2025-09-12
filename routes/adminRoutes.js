// server/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const { getPurchases, getBookings, updateBookingStatus } = require("../ctrl/adminCtrl");

router.get("/purchases", adminAuth, getPurchases);
router.get("/bookings", adminAuth, getBookings);
router.patch("/bookings/:id", adminAuth, updateBookingStatus);

module.exports = router;
