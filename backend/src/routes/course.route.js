import { Router } from "express";
import { getCourses } from "../controllers/course.controller.js";

const router = Router();

router.get("/", getCourses);

export default router;