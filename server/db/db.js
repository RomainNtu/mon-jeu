const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Request to the database
const query = (text, params) => pool.query(text, params);

// Register a new user
const registerUser = async (username, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await query('INSERT INTO players (username, password) VALUES ($1, $2) RETURNING *', [username, hashedPassword]);
  return result.rows[0];
};

// Authenticate a user
const authenticateUser = async (username, password) => {
  const result = await query('SELECT * FROM players WHERE username = $1', [username]);
  const user = result.rows[0];
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
    return { user, token };
  }
  throw new Error('Invalid username or password');
};

module.exports = {
  query,
  registerUser,
  authenticateUser,
};