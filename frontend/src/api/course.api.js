import axiosInstance from "./axios.instance";

// ASSUMPTION: mounted at /api/v1/courses with GET / for the list. If your
// backend instead exposes GET /api/v1/courses/courses, change the path below.
const BASE = "/courses";

export const getCoursesApi = async () => {
  const res = await axiosInstance.get(`${BASE}`);
  return res.data;
};