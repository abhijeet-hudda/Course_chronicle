import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { CREDITS } from "../utils/constants.js";
import { getCookieOptions } from "../utils/cookieOptions.js";

const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || "1d",
  });


const signup = asyncHandler(async (req, res) => {
  const { Name, Email, Password, referralCode, enrolledCourses } = req.body;

  if (!Name?.trim() || !Email?.trim() || !Password?.trim()) {
    throw new ApiError(400, "Name, Email and Password are required");
  }

  const existingUser = await User.findOne({ Email: Email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  let credit = CREDITS.SIGNUP_BASE;
  let userReferred = null;
  if (referralCode) {
    userReferred = await User.findOne({ RefCode: referralCode });
    if (!userReferred) {
      throw new ApiError(400, "User with this referral code doesn't exist.");
    }
    credit += CREDITS.REFERRAL_BONUS;
  }

  const hashPassword = await bcrypt.hash(Password, 12);

  const newUser = await User.create({
    Name,
    Email,
    Password: hashPassword,
    Credit: credit,
    enrolledCourses: enrolledCourses || [],
    RefCode: generateReferralCode(),
  });

  // Only commit the referrer's bonus once we know the new user was saved
  if (userReferred) {
    userReferred.Credit += CREDITS.REFERRAL_BONUS;
    await userReferred.save();
  }

  const token = signToken(newUser._id);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        {
          userId: newUser._id,
          // Token is still returned in the body too, for non-browser clients
          // (mobile app, Postman, etc.) that can't rely on the cookie jar.
          token,
          credit: newUser.Credit,
          refCode: newUser.RefCode,
        },
        "Signup successful"
      )
    );
});

const login = asyncHandler(async (req, res) => {
  const { Email, Password } = req.body;

  if (!Email?.trim() || !Password?.trim()) {
    throw new ApiError(400, "Email and Password are required");
  }

  const existingUser = await User.findOne({ Email: Email.toLowerCase() });
  if (!existingUser || !(await bcrypt.compare(Password, existingUser.Password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signToken(existingUser._id);

  return res
    .status(200)
    .cookie("accessToken", token, getCookieOptions())
    .json(
      new ApiResponse(
        200,
        {
          userId: existingUser._id,
          token,
          credit: existingUser.Credit,
          refCode: existingUser.RefCode,
        },
        "Login successful"
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("accessToken", getCookieOptions())
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const getUnlockedAnswers = asyncHandler(async (req, res) => {
  const { paperId } = req.body;
  if (!paperId) {
    throw new ApiError(400, "paperId is required");
  }

  const user = await User.findById(req.userData.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const entry = user.unlockedAnswers.find((ua) => ua.paperId.toString() === paperId);
  const questionIndexes = entry ? [...entry.questionIndexes].sort((a, b) => a - b) : [];

  return res.status(200).json(new ApiResponse(200, { unlockedAnswers: questionIndexes }));
});

const unlockAnswer = asyncHandler(async (req, res) => {
  const { paperId, questionIndex } = req.body;
  if (!paperId || questionIndex === undefined) {
    throw new ApiError(400, "paperId and questionIndex are required");
  }

  const user = await User.findById(req.userData.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.Credit < CREDITS.UNLOCK_ANSWER_COST) {
    throw new ApiError(400, "Insufficient credits");
  }

  user.Credit -= CREDITS.UNLOCK_ANSWER_COST;

  const entry = user.unlockedAnswers.find((ua) => ua.paperId.toString() === paperId);
  if (entry) {
    if (!entry.questionIndexes.includes(questionIndex)) {
      entry.questionIndexes.push(questionIndex);
      entry.questionIndexes.sort((a, b) => a - b);
    }
  } else {
    user.unlockedAnswers.push({ paperId, questionIndexes: [questionIndex] });
  }

  await user.save();

  return res.status(200).json(new ApiResponse(200, { credit: user.Credit }, "Answer unlocked"));
});

const getNotifications = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userData.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const notifications = [...user.Notification].sort((a, b) => b.CreatedAt - a.CreatedAt);
  return res.status(200).json(new ApiResponse(200, notifications));
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userData.userId).select("-Password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, user));
});

export { signup, login, logout, getUnlockedAnswers, unlockAnswer, getNotifications, getProfile };