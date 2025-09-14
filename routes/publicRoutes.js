// server/routes/publicRoutes.js
const express = require("express");
const router = express.Router();
const { bookSession, createPaymentIntent, logSession, cancelSession, adminSummary } = require("../ctrl/publicCtrl");

router.get("/health", (req, res) => res.json({ status: 200 }));

router.post("/book-session", bookSession);
router.post("/create-payment-intent", createPaymentIntent);
router.post("/log-session", logSession);
router.post("/cancel-payment-intent", cancelSession);


module.exports = router;
