import Razorpay from "razorpay";
import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { CREDITS } from "../utils/constants.js";

const getRazorpayInstance = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

const makePayment = asyncHandler(async (req, res) => {
  const { amount, currency = "INR", receipt } = req.body;

  if (!amount) {
    throw new ApiError(400, "amount is required");
  }

  const razorpay = getRazorpayInstance();
  const order = await razorpay.orders.create({ amount, currency, receipt });

  if (!order) {
    throw new ApiError(500, "Error creating Razorpay order");
  }

  return res.status(200).json(new ApiResponse(200, order));
});

const validatePayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing Razorpay payment details");
  }

  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");

  if (digest !== razorpay_signature) {
    throw new ApiError(400, "Transaction failed: invalid signature");
  }

  const user = await User.findById(req.userData.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Credit amount is server-controlled on purpose — never trust a client-sent
  // credit value for something that moves money (the old code was fine here,
  // just calling it out since it's an easy mistake to introduce later).
  user.Credit += CREDITS.PAYMENT_TOPUP;
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        credit: user.Credit,
      },
      "Payment successful!"
    )
  );
});

export { makePayment, validatePayment };