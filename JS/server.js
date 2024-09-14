// file path: server.js

const express = require('express'); // Import Express framework
const bodyParser = require('body-parser'); // Import Body-parser for parsing request bodies
const twilio = require('twilio'); // Import Twilio library for sending SMS

const app = express(); // Create an Express application
const port = 3000; // Define the port for the server

// Twilio credentials
const accountSid = 'AC463d8d2a692c5993b123dba717ef7308'; // Twilio Account SID
const authToken = '16b728499b87b8015a4c35e77018a558'; // Twilio Auth Token
const client = new twilio(accountSid, authToken); // Create a Twilio client with credentials

app.use(bodyParser.json()); // Middleware to parse JSON request bodies

// POST endpoint to send SMS
app.post('/send-sms', (req, res) => {
    const { to, body } = req.body; // Extract 'to' and 'body' from the request body

    client.messages.create({
        body: body, // Message body
        to: to, // Recipient phone number
        from: '+1 314 798 7034' // Sender phone number (Twilio number)
    })
    .then((message) => res.status(200).send(`Message sent with SID: ${message.sid}`)) // On success, send SID
    .catch((error) => res.status(500).send(`Failed to send message: ${error.message}`)); // On error, send error message
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`); // Log the server address
});
