import React, { useState } from "react";
import Register from "./components/Register";
import Login from "./components/Login";
import Game from "./components/Game";

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleLogin = (user, token) => {
    setUser(user);
    setToken(token);
  };

  return (
    <div>
      {!user ? (
        <div>
          <Register />
          <Login onLogin={handleLogin} />
        </div>
      ) : (
        <Game user={user} token={token} />
      )}
    </div>
  );
};

export default App;