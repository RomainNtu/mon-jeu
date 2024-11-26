
# 🎮 My Game Project

## 📝 Description

**My Game Project** is a real-time multiplayer game application built with modern web technologies: **React**, **PIXI.js**, **Node.js**, and **Socket.IO**. Players can register, log in, and interact with each other in a fun and engaging environment.

---

## 🚀 Features

- 🔐 **User Registration & Authentication**: Secure login system with token-based authentication.
- 🌍 **Real-Time Multiplayer**: Interact with other players in real-time.
- 💬 **Chat Functionality**: Send and receive messages during gameplay.
- 🕹️ **Player Movement**: Smooth movement mechanics with collision detection.

---

## 🛠️ Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (with npm)
- [PostgreSQL](https://www.postgresql.org/)

---

## 📂 Clone the Repository

Clone the repository and navigate to the project folder:

```bash
git clone https://github.com/RomainNtu/mon-jeu
cd mon-jeu
```

---

## 📦 Install Dependencies

Install the required dependencies for both the **client** and **server**:

### Client

```bash
cd client
npm install
```

### Server

```bash
cd ../server
npm install
```

---

## 🗄️ Set Up the Database

Ensure PostgreSQL is running, then create the required database and table:

1. Start the PostgreSQL shell:
   ```bash
   psql
   ```

2. Run the following SQL commands:
   ```sql
   CREATE DATABASE game_db;
   \c game_db
   CREATE TABLE players (
       id SERIAL PRIMARY KEY,
       username VARCHAR(50) UNIQUE NOT NULL,
       password VARCHAR(255) NOT NULL
   );
   ```

---

## ⚙️ Configure Environment Variables

Create `.env` files for both the **client** and **server**, and configure them as follows:

### Client (`client/.env`)

```env
REACT_APP_API_URL=http://localhost:4000
```

### Server (`server/.env`)

```env
DB_USER=USER
DB_HOST=localhost
DB_DATABASE=game_db
DB_PASSWORD=PASSWORD
DB_PORT=5432
JWT_SECRET=your_jwt_secret
```

Replace `USER`, `PASSWORD`, and `your_jwt_secret` with your own credentials.

---

## ▶️ Start the Application

### Start the Server

```bash
cd server
npm start
```

### Start the Client

```bash
cd client
npm start
```

---

## 🖥️ Application Structure

```plaintext
mon-jeu/
├── client/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Register.js
│   │   │   ├── Login.js
│   │   │   └── Game.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── socket.js
│   ├── .env
│   ├── package.json
│   └── .gitignore
├── server/
│   ├── node_modules/
│   ├── db/
│   │   └── db.js
│   ├── index.js
│   ├── .env
│   ├── package.json
│   └── .gitignore
└── [README.md](http://_vscodecontentref_/1)
```

---

## 🎉 Enjoy the Game!

Open the client in your browser at `http://localhost:3000` and start playing!
