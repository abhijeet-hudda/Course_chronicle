import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    Name: {
      type: String,
      required: true,
      trim: true,
    },
    Password: {
      type: String,
      required: true,
    },
    Email: {
      type: String,
      required: true,
      unique: true, // wasn't enforced before — needed a DB-level index or duplicate signups were possible
      lowercase: true,
      trim: true,
      index: true,
    },
    Credit: {
      type: Number,
      required: true,
      default: 100,
    },
    RefCode: {
      type: String,
      required: true,
      unique: true,
    },
    Notification: [
      {
        Message: {
          type: String,
          required: true,
        },
        IsRead: {
          type: Boolean,
          default: false,
        },
        CreatedAt: {
          type: Date,
          default: Date.now,
        },
        paperId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Paper",
        },
      },
    ],
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    browsedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    unlockedAnswers: [
      {
        paperId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Paper",
          required: true,
        },
        questionIndexes: {
          type: [Number],
          required: true,
          default: [],
        },
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);