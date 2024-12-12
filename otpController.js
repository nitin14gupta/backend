const { insertUser, insertOtp, verifyOtp } = require('./queries'); // Import the queries

// Send OTP via SMS
const sendOtp = async (firstName, lastName, mobileNumber) => {
  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE mobile_number = $1', [mobileNumber]);

    let user;
    if (existingUser.rows.length === 0) {
      // Create new user if not found
      user = await insertUser(mobileNumber, firstName, lastName);
    } else {
      user = existingUser.rows[0];
    }

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiration time (5 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Insert OTP into the database (only valid OTPs will be inserted)
    const otpRecord = await insertOtp(user.user_id, otpCode, expiresAt);
    if (!otpRecord) {
      return { error: 'Failed to generate OTP' };
    }

    // Send OTP via Twilio (assuming Twilio setup is correct)
    await client.messages.create({
      body: `Your OTP code is: ${otpCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobileNumber,
    });

    return { message: 'OTP sent successfully', userId: user.user_id };
  } catch (err) {
    console.error('Error sending OTP:', err.stack);
    return { error: 'Failed to send OTP' };
  }
};

// Verify OTP
const verifyOtpHandler = async (mobileNumber, otpCode) => {
  try {
    // Check if user exists
    const userResult = await pool.query('SELECT user_id FROM users WHERE mobile_number = $1', [mobileNumber]);
    if (userResult.rows.length === 0) {
      return { error: 'User not found' };
    }

    const userId = userResult.rows[0].user_id;

    // Verify OTP
    const isValid = await verifyOtp(userId, otpCode);
    if (isValid) {
      // OTP is valid, generate JWT token (use a library like jwt-simple or jsonwebtoken)
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
