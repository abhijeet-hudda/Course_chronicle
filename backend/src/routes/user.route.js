import { Router } from "express";
import {
  signup,
  login,
  logout,
  unlockAnswer,
  getNotifications,
  getUnlockedAnswers,
  getProfile,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", verifyJWT, logout);

// both of these used to hand-parse the JWT inside the controller with no
// route-level guard — now they go through the same verifyJWT everything
// else does.
router.post("/unlockAnswer", verifyJWT, unlockAnswer);
router.post("/getUnlockedAnswers", verifyJWT, getUnlockedAnswers);

router.get("/notifications", verifyJWT, getNotifications);
router.get("/profile", verifyJWT, getProfile);

export default router;