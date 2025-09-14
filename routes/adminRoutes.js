// server/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const { getPurchases, getBookings, updateBookingStatus } = require("../ctrl/adminCtrl");

router.get("/", async (req, res, next)  => {
    res
    .status(200)
    .json({ success: { message: "This route triggers admin side routes" } });
})

//List all sessions (admin-only)
router.get("/sessions", async (req, res) => {
    try {
      // Query database for all booked sessions
    //   const sessions = await db.collection("sessions").find().toArray();
    console.log(sessions, "session tracking")
      res.json({ sessions });
    } catch (err) {
      console.error(err);
    }
});

router.get("/purchases", adminAuth, getPurchases);
router.get("/bookings", adminAuth, getBookings);
router.patch("/bookings/:id", adminAuth, updateBookingStatus);

module.exports = router;
