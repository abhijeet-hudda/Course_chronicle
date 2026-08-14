import mongoose, { Schema } from "mongoose";

const questionSubSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
    },
    embedding: {
      type: [Number], // vector for future similarity search
    },
  },
  { _id: false }
);

const paperSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    filePath: {
      type: String, // Cloudinary secure_url
      required: true,
    },
    publicId: {
      // NOTE: the old schema was missing this field even though the old
      // controller set it, so it was silently dropped by Mongoose. Needed
      // for deleteFromCloudinary to ever be able to clean this file up.
      type: String,
      required: true,
    },
    questions: [questionSubSchema],
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    session: {
      type: String,
      enum: ["Winter", "Summer", "Monsoon"],
      required: true,
    },
    sessionYear: {
      type: String,
      required: true,
    },
    examType: {
      type: String,
      enum: ["Midsem", "Endsem", "Quiz", "Assignment"],
      required: true,
    },
  },
  { timestamps: true, collection: "papers" }
);

export const Paper = mongoose.model("Paper", paperSchema);