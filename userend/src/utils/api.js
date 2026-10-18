import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: "application/json",
  },
});
console.log("API BASE URL:", api.defaults.baseURL);
// Attach the token in the format expected by your backend.
api.interceptors.request.use(
  (config) => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      // Handle a token accidentally stored with the Bearer prefix.
      const token = storedToken.replace(/^Bearer\s+/i, "").trim();

      config.headers = config.headers || {};

      // Your userAuth middleware reads req.headers.token.
      config.headers.token = token;

      // Keep this too for compatibility with other middleware.
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default api;
