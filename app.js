const express = require("express");
const { createOtpTable } = require("./queries");
const { sendOtp, verifyOtpHandler } = require("./otpController");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// Create OTP and Users table on startup
createOtpTable();

// Route to send OTP
app.post("/auth/phone/send-code", async (req, res) => {
  const { phoneNumber, firstName, lastName } = req.body;

  if (!phoneNumber || !firstName || !lastName) {
    return res.status(400).json({ error: "Phone number, first name, and last name are required" });
  }

  const response = await sendOtp(phoneNumber, firstName, lastName);
  res.json(response);
});

// Route to verify OTP
app.post("/auth/phone/verify-code", async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ error: "Phone number and OTP code are required" });
  }

  const response = await verifyOtpHandler(phoneNumber, otpCode);
  res.json(response);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
