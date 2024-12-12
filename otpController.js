// otpController.js
const pool = require("./db");
const twilio = require("twilio");
const jwt = require("jsonwebtoken");
const { insertUser, insertOtp, verifyOtp } = require("./queries");
require("dotenv").config();

// Initialize Twilio client
const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Generate JWT Token
const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1000h",
  });
  return token;
};

// Normalize Phone Number (e.g., add country code if missing)
const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber.startsWith("+")) {
    return `+91${phoneNumber}`; // Assuming India as default country code
  }
  return phoneNumber;
};

// Send OTP
const sendOtp = async (phoneNumber) => {
  try {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    // Check if user exists or create a new user
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE mobile_number = $1",
      [normalizedPhoneNumber]
    );

    let user;
    if (existingUser.rows.length === 0) {
      user = await insertUser(normalizedPhoneNumber);
    } else {
      user = existingUser.rows[0];
    }

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiration (5 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Insert OTP into the database
    const otpRecord = await insertOtp(user.user_id, otpCode, expiresAt);
    if (!otpRecord) {
      return { error: "Failed to generate OTP" };
    }

    // Send OTP via Twilio
    await client.messages.create({
      body: `Your OTP code is: ${otpCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedPhoneNumber,
    });

    return { message: "OTP sent successfully", userId: user.user_id };
  } catch (err) {
    console.error("Error sending OTP:", err.stack);
    return { error: "Failed to send OTP" };
  }
};

// Verify OTP
const verifyOtpHandler = async (phoneNumber, otpCode) => {
  try {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    // Check if user exists
    const userResult = await pool.query(
      "SELECT user_id FROM users WHERE mobile_number = $1",
      [normalizedPhoneNumber]
    );
    if (userResult.rows.length === 0) {
      return { error: "User not found" };
    }

    const userId = userResult.rows[0].user_id;

    // Verify OTP
    const isValid = await verifyOtp(userId, otpCode);
    if (isValid) {
      const token = generateToken(userId);
      return { message: "OTP verified successfully", token };
    } else {
      return { error: "Invalid or expired OTP" };
    }
  } catch (err) {
    console.error("Error verifying OTP:", err.stack);
    return { error: "Failed to verify OTP" };
  }
};

module.exports = {
  sendOtp,
  verifyOtpHandler,
};
