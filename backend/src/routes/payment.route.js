import { Router } from "express";
import { makePayment, validatePayment } from "../controllers/payment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/makePayment", verifyJWT, makePayment);
router.post("/validatePayment", verifyJWT, validatePayment);

export default router;