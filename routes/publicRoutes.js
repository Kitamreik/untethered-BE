// server/routes/publicRoutes.js
const express = require("express");
const router = express.Router();
const { bookSession } = require("../Ctrl/publicCtrl");

router.post("/book-session", bookSession);

module.exports = router;
