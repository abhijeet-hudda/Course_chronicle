import { Router } from "express";
import {
  uploadPaper,
  getQuestion,
  getPapers,
  getDashboard,
  updateBrowsedCourse,
  getPaperByID,
} from "../controllers/question.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/getQuestion", getQuestion);
router.get("/getPapers", getPapers);
router.post("/uploadPaper", verifyJWT, upload.single("file"), uploadPaper);
router.get("/dashboard", verifyJWT, getDashboard);
router.post("/updateBrowsedCourse", verifyJWT, updateBrowsedCourse);
router.post("/getPaperByID", getPaperByID);

export default router;