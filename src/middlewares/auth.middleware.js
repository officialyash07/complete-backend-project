import { ApiError } from "../utils/ApiError.js";

import { asyncHandler } from "../utils/asyncHandler.js";

import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        console.log(token);

        if (!token || typeof token !== "string") {
            throw new ApiError(401, "Token must be a string");
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET.toString()
        );

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // req.user = user;
        req.user = decodedToken;

        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});
