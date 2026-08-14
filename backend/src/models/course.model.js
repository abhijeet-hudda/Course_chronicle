import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);