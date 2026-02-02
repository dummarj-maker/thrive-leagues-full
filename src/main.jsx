import React from "react";
import ReactDOM from "react-dom/client";
import Home from "./Home.jsx";
import "./styles.css";

console.log("✅ main.jsx loaded");

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>
);
