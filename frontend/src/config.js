// src/config.js
const isLocalhost = window.location.hostname === "localhost";
const API_URL = isLocalhost
  ? "http://localhost:5000/api"     // local backend
  : "https://movie-project2-1.onrender.com/api"; // Render backend

export default API_URL;
