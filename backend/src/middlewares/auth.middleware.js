import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// Every route that needs to know "who is calling" should use this instead of
// re-implementing token parsing (the old code duplicated this in 4 places,
// each slightly differently, and a couple of them would throw an unhandled
// error if the Authorization header was simply missing).
export const verifyJWT = asyncHandler(async (req, _res, next) => {
  // Cookie first (the new default flow), Authorization header as a fallback
  // for clients that can't use cookies (e.g. a mobile app, or a Postman test).
  const authHeader = req.header("Authorization");
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const token = req.cookies?.accessToken || headerToken;

  if (!token) {
    throw new ApiError(401, "Authentication failed: no token provided");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(403, "Authentication failed: invalid or expired token");
  }

  const user = await User.findById(decodedToken.userId).select("-Password");
  if (!user) {
    throw new ApiError(403, "Authentication failed: user no longer exists");
  }

  // keep both around: req.userData for existing controller code that expects
  // { userId }, req.user for the full document where a controller needs it
  req.userData = { userId: decodedToken.userId };
  req.user = user;
  next();
});