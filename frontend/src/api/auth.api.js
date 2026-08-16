import axiosInstance from "./axios.instance";

// ASSUMPTION: userRouter is mounted at /api/v1/users in your app.js
// (app.use("/api/v1/users", userRouter)), matching the
// localhost:8000/api/v1/users/login example you gave. If your actual
// mounting differs, this one prefix is the only thing that needs to change.
const BASE = "/users";

// Every call below returns the raw ApiResponse envelope
// ({ statusCode, data, message, success }) — callers destructure `.data`
// and/or `.message` as needed.

export const signupApi = async (payload) => {
  console.log("signup playload:",payload);
  const res = await axiosInstance.post(`${BASE}/signup`, payload);
  return res.data;
};

export const loginApi = async (payload) => {
  const res = await axiosInstance.post(`${BASE}/login`, payload);
  return res.data;
};

export const logoutApi = async () => {
  const res = await axiosInstance.post(`${BASE}/logout`);
  return res.data;
};

export const getProfileApi = async () => {
  const res = await axiosInstance.get(`${BASE}/profile`);
  return res.data;
};

export const getNotificationsApi = async () => {
  const res = await axiosInstance.get(`${BASE}/notifications`);
  return res.data;
};

export const getUnlockedAnswersApi = async (paperId) => {
  const res = await axiosInstance.post(`${BASE}/getUnlockedAnswers`, { paperId });
  return res.data;
};

export const unlockAnswerApi = async (paperId, questionIndex) => {
  const res = await axiosInstance.post(`${BASE}/unlockAnswer`, { paperId, questionIndex });
  return res.data;
};