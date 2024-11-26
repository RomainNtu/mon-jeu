import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import axios from "axios";
import socket from "../socket";
import "../styles/Game.css";

const Game = ({ user, token }) => {
  const canvasRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(user);
  const playerRef = useRef(null);
  const playerMessageBubbleRef = useRef(null);
  const playerMessageTextRef = useRef(null);
  // Other players
  const otherPlayers = {};

  useEffect(() => {
    // Configure Axios to include the token in the headers
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Init PixiJS
    const app = new PIXI.Application({
      width: 1280,
      height: 720,
      backgroundColor: 0x2879b8,
    });
    canvasRef.current.appendChild(app.view);

    // Create a platform with some details
    const platform = new PIXI.Graphics();
    platform.beginFill(0x654321);
    platform.drawRect(0, 517.5, 1280, 50);
    platform.endFill();

    // Add some details to the platform
    const platformDetail = new PIXI.Graphics();
    platformDetail.beginFill(0x8b4513);
    platformDetail.drawRect(0, 517.5, 1280, 10);
    platformDetail.endFill();
    platform.addChild(platformDetail);

    app.stage.addChild(platform);

    // Create a player
    const player = new PIXI.Graphics();
    player.beginFill(0xff0000);
    player.drawCircle(0, 0, 20);
    player.endFill();
    player.x = 400;
    player.y = 530;
    app.stage.addChild(player);
    playerRef.current = player;

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

    // Variables to store the message bubble and text
    let messageBubble = null;
    let messageText = null;
    const padding = 10;

    const wrapText = (text, maxLineLength) => {
      const words = text.split(' ');
      let lines = [];
      let currentLine = '';
    
      words.forEach(word => {
        if ((currentLine + word).length <= maxLineLength) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      });
    
      if (currentLine) {
        lines.push(currentLine);
      }
    
      return lines.join('\n');
    };
    
    const displayMessageBubble = (message, x, y, messageBubbleRef, messageTextRef) => {
      // Wrap text without cutting words
      const wrappedMessage = wrapText(message, 23);
    
      const style = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 14,
        fill: 0x000000,
        wordWrap: true,
        wordWrapWidth: 200 - 2 * padding,
      });
    
      const messageText = new PIXI.Text(wrappedMessage, style);
      messageText.x = padding;
      messageText.y = padding;
    
      const bubbleWidth = messageText.width + 2 * padding;
      const bubbleHeight = messageText.height + 2 * padding;
    
      const messageBubble = new PIXI.Graphics();
      messageBubble.beginFill(0xffffff);
      messageBubble.drawRoundedRect(0, 0, bubbleWidth, bubbleHeight, 10);
      messageBubble.endFill();
      messageBubble.x = x + 25; // Position bubble to the right of the player
      messageBubble.y = y - 70; // Above the player ID
    
      messageText.x = messageBubble.x + padding;
      messageText.y = messageBubble.y + padding;
    
      app.stage.addChild(messageBubble);
      app.stage.addChild(messageText);
    
      // Store references
      messageBubbleRef.current = messageBubble;
      messageTextRef.current = messageText;
    
      setTimeout(() => {
        app.stage.removeChild(messageBubble);
        app.stage.removeChild(messageText);
        messageText.text = "";
        messageBubbleRef.current = null;
        messageTextRef.current = null;
      }, 3000); // Remove bubble after 3 seconds
    };

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

    app.ticker.add(() => {
      if (player) {
        // Apply gravity
        velocityY += gravity;
        player.y += velocityY;
    
        // Collision with the platform
        if (player.y + 20 > 517.5) {
          player.y = 517.5 - 20;
          velocityY = 0;
        }
    
        // Horizontal movement
        if (keys["q"]) player.x -= 5; // Left
        if (keys["d"]) player.x += 5; // Right
    
        // Jump
        if (keys["z"] && player.y === 517.5 - 20) {
          velocityY = jumpStrength;
        }
    
        // Update the player's text position
        playerIdText.x = player.x;
        playerIdText.y = player.y - 30;
        playerMessageText.x = player.x;
        playerMessageText.y = player.y - 50;
    
        // Update the message bubble position
        if (playerMessageBubbleRef.current && playerMessageTextRef.current) {
          playerMessageBubbleRef.current.x = player.x + 25;
          playerMessageBubbleRef.current.y = player.y - 70;
          playerMessageTextRef.current.x = playerMessageBubbleRef.current.x + padding;
          playerMessageTextRef.current.y = playerMessageBubbleRef.current.y + padding;
        }
    
        // Emit the player's position
        socket.emit("player_move", { id: socket.id, username: user.username, x: player.x, y: player.y });
      }
    
      // Update other players' positions and message bubbles
      Object.values(otherPlayers).forEach(({ player, idText, messageText, messageBubbleRef, messageTextRef }) => {
        idText.x = player.x;
        idText.y = player.y - 30;
        messageText.x = player.x;
        messageText.y = player.y - 50;
    
        if (messageBubbleRef && messageBubbleRef.current && messageTextRef && messageTextRef.current) {
          messageBubbleRef.current.x = player.x + 25;
          messageBubbleRef.current.y = player.y - 70;
          messageTextRef.current.x = messageBubbleRef.current.x + padding;
          messageTextRef.current.y = messageBubbleRef.current.y + padding;
        }
      });
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
        displayMessageBubble(data.message, player.x, player.y, playerMessageBubbleRef, playerMessageTextRef);
      } else if (otherPlayers[data.id]) {
        const targetPlayer = otherPlayers[data.id];
        if (!targetPlayer.messageBubbleRef) {
          targetPlayer.messageBubbleRef = { current: null };
        }
        if (!targetPlayer.messageTextRef) {
          targetPlayer.messageTextRef = { current: null };
        }
        displayMessageBubble(data.message, targetPlayer.player.x, targetPlayer.player.y, targetPlayer.messageBubbleRef, targetPlayer.messageTextRef);
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

  const MAX_MESSAGE_LENGTH = 60;

  const handleSendMessage = () => {
    if (message.trim() && message.length <= MAX_MESSAGE_LENGTH) {
      if (playerRef.current) {
        socket.emit("player_message", {
          id: socket.id,
          username: currentUser.username,
          message,
          x: playerRef.current.x,
          y: playerRef.current.y,
        });
      }
      setMessage("");
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      alert(`Le message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères.`);
    }
  };

  return (
    <div ref={canvasRef} className="canvas-container">
    <div className="message-box">
      <div className="message-list">
        {messages.slice(-5).map((msg, index) => (
          <div key={index} className={`message ${msg.isOwnMessage ? 'own' : 'other'}`}>
            <strong>{msg.username}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Entrez votre message ici..."
          maxLength={MAX_MESSAGE_LENGTH}
          className="input-field"
        />
        <button 
          onClick={handleSendMessage} 
          className="send-button"
        >
          Envoyer
        </button>
      </div>
    </div>
  </div>
  );
};

export default Game;