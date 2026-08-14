import mongoose, { Schema } from "mongoose";

// NOTE: this collection doesn't appear to be written to anywhere in the app —
// uploaded papers store their questions embedded inside Paper.questions
// instead. Kept for backward compatibility with GET /getQuestion; see the
// README for details before you decide whether to keep it.
const questionSchema = new Schema(
  {
    Question: {
      type: String,
      required: true,
    },
    Answer: {
      type: String,
      required: true,
    },
    Tag: {
      type: String,
      required: true,
    },
    Title: {
      type: String,
      required: true,
    },
    PaperFile: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Question = mongoose.model("Question", questionSchema);