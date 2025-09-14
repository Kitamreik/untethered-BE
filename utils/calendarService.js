// backend/calendarService.js
const { google } = require("googleapis");

function getAuth() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN } = process.env;

  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return oAuth2Client;
}

async function addEventToCalendar({ summary, description, start, end }) {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary,
    description,
    start: { dateTime: start, timeZone: "America/Denver" }, // adjust time zone
    end: { dateTime: end, timeZone: "America/Denver" },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  return response.data;
}

async function createEvent(booking) {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: `Booking: ${booking.services}`,
    description: `Tier: ${booking.tier}\nQuestions: ${booking.questions}`,
    start: { dateTime: booking.appointmentDate, timeZone: "America/Denver" },
    end: {
      dateTime: new Date(
        new Date(booking.appointmentDate).getTime() + 60 * 60 * 1000
      ).toISOString(),
      timeZone: "America/Denver",
    },
    attendees: [{ email: booking.email }],
  };

  const res = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  return res.data.id; // return Google Calendar Event ID
}

async function deleteEvent(eventId) {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}

module.exports = { addEventToCalendar, createEvent, deleteEvent };
