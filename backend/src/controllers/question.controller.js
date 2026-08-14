import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Question } from "../models/question.model.js";
import { Paper } from "../models/paper.model.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { CREDITS } from "../utils/constants.js";

// Read as plain JSON rather than `import ... with { type: "json" }` — that
// syntax needs a fairly recent Node (22+) and isn't worth the version
// constraint here.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const promptTemplate = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/prompt.json"), "utf-8"));

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_KEY}`;

// TODO (flagged for you): this is a placeholder, not a real embedding model —
// see the README for what needs to change before "similar question" search
// can actually work.
async function getVectorEmbedding(_text) {
  return Array.from({ length: 10 }, () => Math.random());
}

function sanitizeJsonResponse(str) {
  const noLines = str.replace(/[\r\n]+/g, "");
  return noLines.replace(/(\\+)(?!["\\/bfnrtu])/g, (match, slashes) => slashes + slashes);
}

function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function rejectPaper(userId, label, reason, localFilePath) {
  if (localFilePath && fs.existsSync(localFilePath)) {
    fs.unlinkSync(localFilePath);
  }
  const user = await User.findById(userId);
  if (!user) return;
  user.Credit = Math.max(0, user.Credit - CREDITS.UPLOAD_REJECTED_PENALTY);
  user.Notification.push({
    Message: `Your paper [${label}] has been rejected: ${reason}.`,
  });
  await user.save();
}

// Runs after the HTTP response has already been sent — errors here can only
// reach the user via a Notification, never via the original request/response.
async function processPaperInBackground({ localFilePath, userId, title, originalname, mimetype }) {
  const label = title || originalname;

  try {
    // Read the file for Gemini BEFORE handing it to uploadOnCloudinary, which
    // deletes the local copy once it uploads it.
    const imageBase64 = fs.readFileSync(localFilePath).toString("base64");
    const parts = [
      { text: JSON.stringify(promptTemplate, null, 2) },
      { inlineData: { mimeType: mimetype, data: imageBase64 } },
    ];

    const apiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      throw new Error(`Gemini API call failed with status ${apiResponse.status}: ${errorBody}`);
    }

    const result = await apiResponse.json();
    const jsonResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonResponse) {
      throw new Error("Gemini API returned an unexpected response shape");
    }

    const parsed = JSON.parse(sanitizeJsonResponse(jsonResponse));

    if (parsed?.course?.code === "-1" || parsed?.session?.toString() === "-1") {
      await rejectPaper(userId, label, "could not be identified as a valid exam paper", localFilePath);
      return;
    }

    let courseObj = await Course.findOne({ code: parsed.course.code });
    if (!courseObj) {
      const nameRegex = new RegExp(`^${escapeRegex(parsed.course.name)}`, "i");
      courseObj = await Course.findOne({ name: { $regex: nameRegex } });
    }
    if (!courseObj) {
      await rejectPaper(userId, label, "could not be matched with a valid course", localFilePath);
      return;
    }

    const existingPaper = await Paper.findOne({
      course: courseObj._id,
      session: parsed.session,
      sessionYear: parsed.sessionYear,
      examType: parsed.examType,
    });
    if (existingPaper) {
      if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
      const user = await User.findById(userId);
      if (user) {
        user.Notification.push({
          Message: `Your paper [${label}] is already present in the database.`,
          paperId: existingPaper._id,
        });
        await user.save();
      }
      return;
    }

    // Only spend Cloudinary storage/bandwidth once we know the paper is
    // actually going to be saved.
    const cloudinaryResult = await uploadOnCloudinary(localFilePath);
    if (!cloudinaryResult) {
      throw new Error("Failed to upload file to Cloudinary");
    }

    const questionsWithEmbeddings = await Promise.all(
      (parsed.questions || []).map(async (item) => ({
        question: item.question,
        answer: item.answer,
        tag: item.tag,
        embedding: await getVectorEmbedding(`${item.question} ${item.answer}`),
      }))
    );

    const paper = await Paper.create({
      title: label,
      filePath: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      course: courseObj._id,
      session: parsed.session,
      sessionYear: parsed.sessionYear,
      examType: parsed.examType,
      questions: questionsWithEmbeddings,
    });

    const user = await User.findById(userId);
    if (user) {
      user.Credit += CREDITS.UPLOAD_APPROVED_REWARD;
      user.Notification.push({
        Message: `Your paper [${parsed.course.code}] ${parsed.course.name} (${parsed.examType}) has been approved!`,
        paperId: paper._id,
      });
      await user.save();
    }
  } catch (error) {
    console.error("Paper processing failed:", error);
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    const user = await User.findById(userId);
    if (user) {
      user.Notification.push({
        Message: `Your paper [${label}] was rejected due to an error. Please try again.`,
      });
      await user.save();
    }
  }
}

const uploadPaper = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const user = await User.findById(req.userData.userId);
  if (!user) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw new ApiError(404, "Authentication failed, user not found");
  }

  // Ack immediately — the actual AI processing can take a while and the
  // client is notified asynchronously via GET /notifications instead.
  res
    .status(202)
    .json(new ApiResponse(202, {}, "Paper submitted for review. You will be notified once processing is complete."));

  processPaperInBackground({
    localFilePath: req.file.path,
    userId: req.userData.userId,
    title: req.body.title,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
  });
});

const getQuestion = asyncHandler(async (_req, res) => {
  const data = await Question.find();
  return res.status(200).json(new ApiResponse(200, data));
});

const getPapers = asyncHandler(async (_req, res) => {
  const papers = await Paper.find().populate("course");
  return res.status(200).json(new ApiResponse(200, papers));
});

const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.userData.userId;
  const user = await User.findById(userId).populate("enrolledCourses").populate("browsedCourses");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const enrolled = user.enrolledCourses.map((course) => course._id.toString());

  const freq = {};
  user.browsedCourses.forEach((course) => {
    const id = course._id ? course._id.toString() : course.toString();
    freq[id] = (freq[id] || 0) + 1;
  });
  const topBrowsed = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  const relevantCourses = [...new Set([...enrolled, ...topBrowsed])];

  const papers =
    relevantCourses.length === 0
      ? await Paper.find().populate("course").sort({ createdAt: -1 }).limit(10)
      : await Paper.find({ course: { $in: relevantCourses } })
          .populate("course")
          .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, papers));
});

const updateBrowsedCourse = asyncHandler(async (req, res) => {
  const userId = req.userData.userId;
  const { course: courseCode } = req.body;
  if (!courseCode) {
    throw new ApiError(400, "Course code is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const foundCourse = await Course.findOne({ code: courseCode });
  if (!foundCourse) {
    throw new ApiError(400, "No course found with the given code");
  }

  if (!user.browsedCourses.some((c) => c.equals(foundCourse._id))) {
    user.browsedCourses.push(foundCourse._id);
    await user.save();
  }

  return res.status(200).json(new ApiResponse(200, {}, "User browsed courses updated"));
});

const getPaperByID = asyncHandler(async (req, res) => {
  const { paperID } = req.body;
  if (!paperID || !mongoose.isValidObjectId(paperID)) {
    throw new ApiError(400, "A valid paperID is required");
  }

  const paper = await Paper.findById(paperID).populate("course");
  if (!paper) {
    throw new ApiError(404, "No paper found for the provided paper ID");
  }

  return res.status(200).json(new ApiResponse(200, paper, "Paper retrieved successfully"));
});

export { 
    uploadPaper,
    getQuestion,
    getPapers,
    getDashboard,
    updateBrowsedCourse,
    getPaperByID 
};