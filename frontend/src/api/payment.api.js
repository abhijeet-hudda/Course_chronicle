import axiosInstance from "./axios.instance";

// ASSUMPTION: mounted at /api/v1/payments, matching the {{server}}/payments/makePayment
// you tested in Postman. Adjust if different.
const BASE = "/payments";

export const makePaymentApi = async (payload) => {
  const res = await axiosInstance.post(`${BASE}/makePayment`, payload);
  return res.data;
};

export const validatePaymentApi = async (payload) => {
  const res = await axiosInstance.post(`${BASE}/validatePayment`, payload);
  return res.data;
};