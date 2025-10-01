// server/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const { getPurchases, getBookings, updateBookingStatus, adminSummary, createIntake, getIntakes, deleteIntake } = require("../ctrl/adminCtrl");

//Quick Check
router.get("/", (req, res, next) => res.json({message: "Admin API functional", status: 200 }));
router.get("/health", adminSummary); //email automation

//FE Form - for data transmission
router.post("/intakes", createIntake);
router.get("/all-intakes", getIntakes);
router.delete("/all-intakes/:id", deleteIntake);


router.get("/sessions", (req, res, next) => res.json({ status: 200 }));
//-----
router.get("/purchases", adminAuth, getPurchases);
router.get("/bookings", adminAuth, getBookings);
router.patch("/bookings/:id", adminAuth, updateBookingStatus); //post if not operational

module.exports = router;
