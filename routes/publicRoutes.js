// server/routes/publicRoutes.js
const express = require("express");
const router = express.Router();
const { bookSession, createPaymentIntent, logSession, cancelSession, createIntake, getIntakes } = require("../ctrl/publicCtrl");

router.get("/", async (req, res, next)  => {
    res
    .status(200)
    .json({ success: { message: "This route triggers public routes" } });
})

router.post("/book-session", bookSession);
router.post("/create-payment-intent", createPaymentIntent);
router.post("/log-session", logSession);
router.post("/cancel-payment-intent", cancelSession);

router.post("/intake", createIntake);
router.get("/intake", getIntakes);


module.exports = router;
