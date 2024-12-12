// app.js
const express = require("express");
const { sendOtp, verifyOtpHandler } = require("./otpController");
const { createUsersTable, createOtpTable } = require("./queries");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// Create tables on startup if they don't exist
createUsersTable();
createOtpTable();

// Routes for OTP sending and verifying
app.post("/auth/phone/send-code", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  const response = await sendOtp(phoneNumber);
  res.json(response);
});

app.post("/auth/phone/verify-code", async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ error: "Phone number and OTP code are required" });
  }

  const response = await verifyOtpHandler(phoneNumber, otpCode);
  res.json(response);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
