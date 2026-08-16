import axiosInstance from "./axios.instance";

// ASSUMPTION: mounted at /api/v1/questions. Adjust if different.
const BASE = "/questions";

export const getQuestionApi = async () => {
  const res = await axiosInstance.get(`${BASE}/getQuestion`);
  return res.data;
};

export const getPapersApi = async () => {
  const res = await axiosInstance.get(`${BASE}/getPapers`);
  return res.data;
};

export const getDashboardApi = async () => {
  const res = await axiosInstance.get(`${BASE}/dashboard`);
  return res.data;
};

export const updateBrowsedCourseApi = async (courseCode) => {
  const res = await axiosInstance.post(`${BASE}/updateBrowsedCourse`, { course: courseCode });
  return res.data;
};

export const getPaperByIdApi = async (paperID) => {
  const res = await axiosInstance.post(`${BASE}/getPaperByID`, { paperID });
  return res.data;
};

// multipart/form-data — don't set Content-Type manually elsewhere, axios
// derives the correct boundary from the FormData instance itself.
export const uploadPaperApi = async (formData) => {
  const res = await axiosInstance.post(`${BASE}/uploadPaper`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};