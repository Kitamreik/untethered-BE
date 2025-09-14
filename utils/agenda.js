// backend/agenda.js
const Agenda = require("agenda");
const mongoose = require("mongoose");
const { sendEmail } = require("./emailService");
const Booking = require("./models/Booking"); 
const Purchase = require("./models/Purchase");

const mongoConnString = process.env.MONGODB_URI;
if (!mongoConnString) throw new Error("MONGODB_URI is required");

const agenda = new Agenda({
  db: { address: mongoConnString, collection: "agendaJobs" },
});

agenda.define("send-reminder-email", async (job) => {
  const { bookingId, reminderType } = job.attrs.data || {};
  if (!bookingId) return;

  try {
    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      console.warn("send-reminder-email: booking not found", bookingId);
      return;
    }

    const subject = `Reminder: upcoming session (${reminderType})`;
    const html = `
      <p>Hi ${booking.purchaserEmail},</p>
      <p>This is a reminder that you have a session scheduled for ${new Date(booking.sessionDate).toLocaleString()}.</p>
      <p>Reminder: ${reminderType}</p>
      <p>Thanks,<br/>Untethered Coaching</p>
    `;

    await sendEmail({ to: booking.purchaserEmail, subject, html });
    // Optional: notify admin that reminder was sent
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `Reminder sent: ${booking.purchaserEmail} (${reminderType})`,
      html: `<p>Reminder (${reminderType}) sent for booking ${bookingId}</p>`,
    });
  } catch (err) {
    console.error("Agenda job error (send-reminder-email):", err);
    throw err;
  }
});

async function startAgenda() {
  await agenda.start();
  console.log("Agenda started");
}

module.exports = { agenda, startAgenda };
