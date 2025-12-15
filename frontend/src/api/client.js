// frontend/src/api/client.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// later: attach JWT token here (when you implement login)
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
