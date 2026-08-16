import axios from "axios";

// One axios instance for the whole app. withCredentials is what makes the
// httpOnly `accessToken` cookie set by the backend actually get sent back
// on every request — without it, the cookie-based auth flow silently does
// nothing and every protected route 401s.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// If any request comes back 401/403, the session is dead (expired/invalid
// cookie) — clear the Redux auth state everywhere in the app instead of
// leaving stale "logged in" UI around. Dynamic imports here (instead of a
// top-level import of the store) avoid a circular import: store -> authSlice
// -> authApi -> axiosInstance -> store.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const { store } = await import("../store/store.js");
      const { clearUser } = await import("../store/authSlice.js");
      store.dispatch(clearUser());
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;