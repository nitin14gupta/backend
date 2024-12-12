const pool = require("./db");

// Function to create the Users table if it doesn't exist
const createUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      mobile_number VARCHAR(15) UNIQUE NOT NULL,
      jwt_token TEXT NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      gender VARCHAR(10),
      age INT,
      height DECIMAL(5,2),
      religion VARCHAR(100),
      drinking BOOLEAN,
      smoking BOOLEAN,
      preferred_gender VARCHAR(10),
      budget DECIMAL(10,2),
      preferred_location VARCHAR(100),
      prompt TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("Users table created successfully");
  } catch (err) {
    console.error("Error creating Users table:", err);
  }
};

// Function to create the OTP table if it doesn't exist
const createOtpTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS otp (
      otp_id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      otp_code VARCHAR(6),
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log("OTP table created successfully");
  } catch (err) {
    console.error("Error creating OTP table:", err);
  }
};

// Insert user into the database
const insertUser = async (mobileNumber) => {
  try {
    const result = await pool.query(
      "INSERT INTO users (mobile_number, jwt_token) VALUES ($1, '') RETURNING user_id",
      [mobileNumber]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error inserting user:", err);
    throw err;
  }
};

// Insert OTP into the OTP table
const insertOtp = async (userId, otpCode, expiresAt) => {
  try {
    const result = await pool.query(
      "INSERT INTO otp (user_id, otp_code, expires_at) VALUES ($1, $2, $3) RETURNING otp_id",
      [userId, otpCode, expiresAt]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error inserting OTP:", err);
    return null;
  }
};

// Verify OTP
const verifyOtp = async (userId, otpCode) => {
  try {
    const result = await pool.query(
      "SELECT otp_code, expires_at FROM otp WHERE user_id = $1 AND otp_code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [userId, otpCode]
    );

    if (result.rows.length === 0) {
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return false;
  }
};

module.exports = {
  insertUser,
  insertOtp,
  verifyOtp,
  createUsersTable,
  createOtpTable,
};
