import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import axios from "axios"; // Assurez-vous d'importer axios
import socket from "../socket";

const Game = ({ user, token }) => {
  const canvasRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Configure Axios to include the token in the headers
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Init PixiJS
    const app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x1099bb,
    });
    canvasRef.current.appendChild(app.view);

    // Create a platform
    const platform = new PIXI.Graphics();
    platform.beginFill(0x654321);
    platform.drawRect(0, 550, 800, 50);
    platform.endFill();
    app.stage.addChild(platform);

    // Create a player
    const player = new PIXI.Graphics();
    player.beginFill(0xff0000);
    player.drawCircle(0, 0, 20);
    player.endFill();
    player.x = 400;
    player.y = 530; // Positioned on the platform
    app.stage.addChild(player);

    // Create a text to display the player ID
    const playerIdText = new PIXI.Text(user.username, { fontSize: 16, fill: 0xffffff });
    playerIdText.anchor.set(0.5);
    playerIdText.x = player.x;
    playerIdText.y = player.y - 30; // Above the player
    app.stage.addChild(playerIdText);

    // Create a text to display the player's message
    const playerMessageText = new PIXI.Text("", { fontSize: 16, fill: 0xffffff });
    playerMessageText.anchor.set(0.5);
    playerMessageText.x = player.x;
    playerMessageText.y = player.y - 50; // Above the player ID
    app.stage.addChild(playerMessageText);

    // Keyboard input
    const keys = {};
    const onKeyDown = (e) => {
      keys[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let velocityY = 0;
    const gravity = 0.2;
    const jumpStrength = -7;

    // Other players
    const otherPlayers = {};

    app.ticker.add(() => {
      if (player) {
        // Apply gravity
        velocityY += gravity;
        player.y += velocityY;

        // Collision with the platform
        if (player.y + 20 > 550) {
          player.y = 530;
          velocityY = 0;
        }

        // Horizontal movement
        if (keys["q"]) player.x -= 2; // Left
        if (keys["d"]) player.x += 2; // Right

        // Jump
        if (keys["z"] && player.y === 530) {
          velocityY = jumpStrength;
        }

        // Update the player's text position
        playerIdText.x = player.x;
        playerIdText.y = player.y - 30;
        playerMessageText.x = player.x;
        playerMessageText.y = player.y - 50;

        // Emit the player's position
        socket.emit("player_move", { id: socket.id, username: user.username, x: player.x, y: player.y });
      }
    });

    // Listen to other players' movements
    socket.on("player_move", (data) => {
      if (app.stage) { // Check if the app is still running
        if (!otherPlayers[data.id]) {
          // Create a new player
          const newPlayer = new PIXI.Graphics();
          newPlayer.beginFill(0x0000ff); // Different color for other players
          newPlayer.drawCircle(0, 0, 20);
          newPlayer.endFill();
          app.stage.addChild(newPlayer);

          // Create a text to display the player ID
          const newPlayerIdText = new PIXI.Text(data.username, { fontSize: 16, fill: 0xffffff });
          newPlayerIdText.anchor.set(0.5);
          app.stage.addChild(newPlayerIdText);

          // Create a text to display the player's message
          const newPlayerMessageText = new PIXI.Text("", { fontSize: 16, fill: 0xffffff });
          newPlayerMessageText.anchor.set(0.5);
          app.stage.addChild(newPlayerMessageText);

          otherPlayers[data.id] = { player: newPlayer, idText: newPlayerIdText, messageText: newPlayerMessageText };
        }
        // Update the player's position and text
        otherPlayers[data.id].player.x = data.x;
        otherPlayers[data.id].player.y = data.y;
        otherPlayers[data.id].idText.x = data.x;
        otherPlayers[data.id].idText.y = data.y - 30;
        otherPlayers[data.id].messageText.x = data.x;
        otherPlayers[data.id].messageText.y = data.y - 50;
      }
    });

    // Listen to player messages
    socket.on("player_message", (data) => {
      if (data.id === socket.id) {
        playerMessageText.text = data.message;
        setTimeout(() => {
          playerMessageText.text = "";
        }, 5000); // Clear the message after 5 seconds
      } else if (otherPlayers[data.id]) {
        otherPlayers[data.id].messageText.text = data.message;
        setTimeout(() => {
          otherPlayers[data.id].messageText.text = "";
        }, 5000); // Clear the message after 5 seconds
      }
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Listen to player disconnections
    socket.on("player_disconnect", (id) => {
      if (otherPlayers[id]) {
        app.stage.removeChild(otherPlayers[id].player);
        app.stage.removeChild(otherPlayers[id].idText);
        app.stage.removeChild(otherPlayers[id].messageText);
        delete otherPlayers[id];
      }
    });

    // Emit player disconnection on window close
    window.addEventListener("beforeunload", () => {
      socket.emit("player_disconnect");
    });

    // Clean up
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("beforeunload", () => {
        socket.emit("player_disconnect");
      });
      app.destroy(true, { children: true });
      socket.off("player_message");
      socket.off("player_move");
      socket.off("player_disconnect");
    };
  }, [user, token]);

  const handleSendMessage = () => {
    if (message.trim()) {
      socket.emit("player_message", { id: socket.id, username: user.username, message });
      setMessage("");
    }
  };

  return (
    <div>
      <div ref={canvasRef}></div>
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.username}:</strong> {msg.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Game;