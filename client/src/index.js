import React from "react";
import ReactDOM from "react-dom/client"; // Client-side ReactDOM
import App from "./App";

// Select root element
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement); // Create a root

// Render the App component
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
