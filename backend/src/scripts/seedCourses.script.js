// Run with: npm run seed
// The old code re-checked and potentially re-seeded the Courses collection
// on every single server boot, inside the DB-connect callback. That's a
// migration/seed concern, not something that belongs on the request path —
// moved here as an explicit, one-off script instead.
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../db/db_connect.js";
import { Course } from "../models/course.model.js";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const seed = async () => {
  await connectDB();

  const coursesFilePath = path.join(__dirname, "../data/courses.json");
  const count = await Course.countDocuments();

  if (count > 0) {
    console.log(`Courses collection already has ${count} document(s) — skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  const courses = JSON.parse(fs.readFileSync(coursesFilePath, "utf-8"));
  await Course.insertMany(courses);
  console.log(`Seeded ${courses.length} course(s) from courses.json`);
  await mongoose.disconnect();
};

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });