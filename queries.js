const pool = require('./db');

// Create the OTP table with a user_id column (to uniquely identify users)
const createOtpTable = async () => {
  try {
    const createTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(15) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createTable);

    const createOtpTable = `
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createOtpTable);
    console.log('OTP table and Users table created successfully');
  } catch (err) {
    console.error('Error creating tables:', err.stack);
  }
};

// Insert a new user into the users table
const insertUser = async (phoneNumber) => {
  try {
    const result = await pool.query(
      `INSERT INTO users (phone_number) VALUES ($1) RETURNING id, phone_number`,
      [phoneNumber]
    );
    return result.rows[0]; // Returns the inserted user object
  } catch (err) {
    console.error('Error inserting user:', err.stack);
    return null;
  }
};

// Insert OTP into the database
const insertOtp = async (userId, otpCode, expiresAt) => {
  try {
    const result = await pool.query(
      `INSERT INTO otps (user_id, otp_code, expires_at) 
      VALUES ($1, $2, $3) RETURNING *`,
      [userId, otpCode, expiresAt]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Error inserting OTP:', err.stack);
    return null;
  }
};

// Verify OTP
const verifyOtp = async (userId, otpCode) => {
  try {
    const result = await pool.query(
      `SELECT * FROM otps WHERE user_id = $1 AND otp_code = $2 AND expires_at > NOW()`,
      [userId, otpCode]
    );
    return result.rows.length > 0; // Return true if OTP is valid
  } catch (err) {
    console.error('Error verifying OTP:', err.stack);
    return false;
  }
};

module.exports = {
  createOtpTable,
  insertUser,
  insertOtp,
  verifyOtp,
};
