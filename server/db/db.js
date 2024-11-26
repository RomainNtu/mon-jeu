const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Database connection
const pool = new Pool({
  user: 'postgres',         // User PostgreSQL
  host: 'localhost',         // Host PostgreSQL
  database: 'game_db',       // Database PostgreSQL
  password: 'Romainn239', // Password PostgreSQL
  port: 5432,                // Port PostgreSQL
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
    const token = jwt.sign({ id: user.id, username: user.username }, 'your_jwt_secret');
    return { user, token };
  }
  throw new Error('Invalid username or password');
};

module.exports = {
  query,
  registerUser,
  authenticateUser,
};