import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Course } from "../models/course.model.js";

const getCourses = asyncHandler(async (_req, res) => {
  const courses = await Course.find({});
  return res.status(200).json(new ApiResponse(200, courses));
});

export { getCourses };