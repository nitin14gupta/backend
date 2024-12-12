const pool = require("./db");

// Create tables
const createOtpTable = async () => {
  try {
    // Create users table with user_id as primary key
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        phone_number VARCHAR(15) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createUsersTable);

    // Create otps table referencing user_id in the users table
    const createOtpsTable = `
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createOtpsTable);

    console.log("Users and OTPs tables created successfully");
  } catch (err) {
    console.error("Error creating tables:", err.stack);
  }
};

// Insert a new user into the users table
const insertUser = async (phoneNumber, firstName, lastName) => {
  try {
    const result = await pool.query(
      `INSERT INTO users (phone_number, first_name, last_name) 
      VALUES ($1, $2, $3) RETURNING user_id, phone_number`,
      [phoneNumber, firstName, lastName]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error inserting user:", err.stack);
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
    console.error("Error inserting OTP:", err.stack);
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
    return result.rows.length > 0;
  } catch (err) {
    console.error("Error verifying OTP:", err.stack);
    return false;
  }
};

module.exports = {
  createOtpTable,
  insertUser,
  insertOtp,
  verifyOtp,
};
