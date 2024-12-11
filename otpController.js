const pool = require('./db'); // Import the pool object
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const { insertUser, insertOtp, verifyOtp } = require('./queries');
require('dotenv').config();

// Initialize Twilio client
const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Generate JWT Token
const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: '1000h',
  });
  return token;
};

// Normalize Phone Number
const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber.startsWith('+')) {
    // Prepend country code (+91 for India) if not present
    return `+91${phoneNumber}`;
  }
  return phoneNumber;
};

// Send OTP via SMS
const sendOtp = async (phoneNumber) => {
  try {
    // Normalize phone number to E.164 format
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE phone_number = $1', [normalizedPhoneNumber]);

    let user;
    if (existingUser.rows.length === 0) {
      // Create new user if not found
      user = await insertUser(normalizedPhoneNumber);
    } else {
      user = existingUser.rows[0];
    }

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiration time (5 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Insert OTP into the database (only valid OTPs will be inserted)
    const otpRecord = await insertOtp(user.id, otpCode, expiresAt);
    if (!otpRecord) {
      return { error: 'Failed to generate OTP' };
    }

    // Send OTP via Twilio
    await client.messages.create({
      body: `Your OTP code for SafarSaathi is: ${otpCode}. This is a one-time code for SafarSaathi App. Enjoy 😊`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: normalizedPhoneNumber,
    });

    return { message: 'OTP sent successfully', userId: user.id };
  } catch (err) {
    console.error('Error sending OTP:', err.stack);
    return { error: 'Failed to send OTP' };
  }
};

// Verify OTP
const verifyOtpHandler = async (phoneNumber, otpCode) => {
  try {
    // Normalize phone number to E.164 format
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE phone_number = $1', [normalizedPhoneNumber]);
    if (userResult.rows.length === 0) {
      return { error: 'User not found' };
    }

    const userId = userResult.rows[0].id;

    // Verify OTP
    const isValid = await verifyOtp(userId, otpCode);
    if (isValid) {
      // OTP is valid, generate JWT token
      const token = generateToken(userId);
      return { message: 'OTP verified successfully', token };
    } else {
      return { error: 'Invalid or expired OTP' };
    }
  } catch (err) {
    console.error('Error verifying OTP:', err.stack);
    return { error: 'Failed to verify OTP' };
  }
};

module.exports = {
  sendOtp,
  verifyOtpHandler,
};
