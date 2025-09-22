// server/controllers/publicController.js
const Purchase = require("../models/Purchase");
const Booking = require("../models/Booking");
const Intake = require ("../models/Intake");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
//Email Automation
const { sendEmail } = require("../utils/emailService");
const { agenda } = require("../utils/agenda");
const { addEventToCalendar, createEvent, deleteEvent } = require("../utils/calendarService");

async function createPaymentIntent(req, res, next) {
  try {
    const { packageId, price, packageName, purchaserEmail } = req.body;

    if (!packageId || !price) {
      return res.status(400).json({ error: "Missing packageId or price" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price,
      currency: "usd",
      metadata: { packageId, purchaserEmail, packageName: packageName || "unknown" },
      receipt_email: purchaserEmail,
    });

    const purchase = await Purchase.create({
      packageId,
      packageName,
      amount: price,
      currency: "usd",
      stripePaymentIntentId: paymentIntent.id,
      customerEmail: purchaserEmail,
      status: "pending",
      createdAt: new Date(),
    });

    res.json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id, purchase });
  } catch (err) {
    console.error("createPaymentIntent error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function logSession(req, res, next) {
  try {
    const { packageId, packageName, amount = 0, currency = "usd", purchaserEmail, stripePaymentIntentId, status } = req.body;
    
    //OG: packageId, packageName, stripePaymentIntentId, purchaserEmail

    if (!packageId || !stripePaymentIntentId) {
      return res.status(400).json({ error: "Missing packageId or stripePaymentIntentId" });
    }

    const purchase = await Purchase.findOneAndUpdate(
      { stripePaymentIntentId },
      { status: "paid", updatedAt: new Date() },
      { new: true }
    );

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    const booking = await Booking.create({
      packageId,
      purchaseId: purchase._id,
      //added
      packageName: packageName || "unknown",
      amount,
      currency,
      customerEmail: purchaserEmail || "unknown",
      stripePaymentIntentId: stripePaymentIntentId || "unknown",
      //added
      status: "unbooked",
      createdAt: new Date(),
    });

    // notify admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: "New purchase logged",
      html: `<p>Purchase logged: ${purchase.packageName} - ${purchase.customerEmail}</p>`,
    });

    res.json({ status: "ok", booking });
  } catch (err) {
    console.error("logSession error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// Called by frontend after payment success to book a session
async function bookSession(req, res, next) {
  try {
    const { packageId, sessionDate, purchaserEmail, stripePaymentIntentId } = req.body;

    if (!packageId || !sessionDate || !purchaserEmail) {
      return res.status(400).json({ error: "packageId, sessionDate and purchaserEmail required" });
    }

    // Try to find matching Purchase (logged by webhook)
    let purchase = null;
    if (stripePaymentIntentId) {
      purchase = await Purchase.findOne({ stripePaymentIntentId });
    }

    // If purchase not found, create a minimal record (webhook may be delayed)
    if (!purchase) {
      purchase = await Purchase.create({
        packageId,
        amount: 0,
        currency: "usd",
        stripePaymentIntentId: stripePaymentIntentId || "unknown",
        customerEmail: purchaserEmail,
        status: "unknown"
      });
    }

    const booking = await Booking.create({
      packageId,
      packageName: purchase.packageName || "unknown",
      purchaseId: purchase._id,
      sessionDate: new Date(sessionDate),
      purchaserEmail: purchaserEmail
    });

    // schedule reminders (7 and 3 days before if in future)
    const sessionDt = new Date(sessionDate);
    const jobIds = [];
    const endDt = new Date(sessionDt.getTime() + 60 * 60 * 1000); // default 1h

    // add event to Google Calendar
    try {
      const event = await addEventToCalendar({
        summary: `Coaching Session - ${purchaserEmail}`,
        description: `Package: ${purchase.packageName}`,
        start: sessionDt.toISOString(),
        end: endDt.toISOString(),
      });

      console.log("Google Calendar event created:", event.htmlLink);
    } catch (err) {
      console.error("Failed to create calendar event:", err.message);
    }

    //Reminder emails
    const scheduleIfFuture = async (daysPrior, label) => {
      const sendAt = new Date(sessionDt.getTime() - daysPrior * 24 * 60 * 60 * 1000);
      if (sendAt > new Date()) {
        const job = await agenda.schedule(sendAt, "send-reminder-email", {
          bookingId: booking._id.toString(),
          reminderType: `${daysPrior}-day`,
        });
        jobIds.push(job.attrs._id.toString());
      }
    };

    await scheduleIfFuture(7);
    await scheduleIfFuture(3);
    await scheduleIfFuture(1); //MVP request

    booking.reminderJobIds = jobIds;
    await booking.save();

    // send immediate confirmation email to client
    const clientHtml = `
      <p>Hi ${purchaserEmail},</p>
      <p>Thanks — your booking for ${new Date(sessionDt).toLocaleString()} is confirmed.</p>
      <p>If you need to cancel, reply to this email.</p>
    `;
    await sendEmail({ to: purchaserEmail, subject: "Booking confirmation", html: clientHtml });

    // notify admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: "New booking created",
      html: `<p>New booking: ${booking._id} for ${purchaserEmail} on ${new Date(sessionDt).toLocaleString()}</p>`,
    });


    res.json({ status: "ok", booking });
  } catch (err) {
    console.error("bookSession error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function cancelSession(req, res, next) {
  try {
    //Base
    /*
     const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Missing paymentIntentId" });
    }

    const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    await Purchase.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntentId },
      { status: "canceled", updatedAt: new Date() }
    );
    */
   
    const { paymentIntentId, bookingId } = req.body;
    // Cancel Stripe PaymentIntent if provided
    if (paymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(paymentIntentId);
      } catch (err) {
        console.warn("stripe cancel error:", err.message || err);
      }
    }

    // If bookingId provided, cancel agenda jobs for that booking
    if (bookingId) {
      // Cancel all agenda jobs with this bookingId in data
      await agenda.cancel({ "data.bookingId": bookingId });
      // Optionally update booking doc
      await Booking.findByIdAndUpdate(bookingId, { reminderJobIds: [] }).catch(() => {});
    }

    res.json({ status: "ok" }); //OG: include canceledIntent
  } catch (err) {
    console.error("cancelSession error:", err);
    res.status(500).json({ error: "Server error" });
  }
}


//Intake Log Form from FE
async function createIntake(req, res, next) {
  try {
    console.log("BE intake received: ", req.body);
    const newIntake = new Intake(req.body);
    newIntake.save();
    res.status(201).json(intake, {success: true});
  } catch (err) {
    console.error("Error saving intake:", err);
    res.status(500).json({success: false, error: "Failed to save intake" });
  }
}

async function getIntakes(req, res, next) {
  try {
    const intakes = await Intake.find().sort({ createdAt: -1 });
    res.json(intakes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch intakes" });
  }
}

module.exports = { bookSession, createPaymentIntent, logSession, cancelSession, createIntake, getIntakes };
