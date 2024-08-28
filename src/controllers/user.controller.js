import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js";

import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/user.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
    // Implement your logic here
    // get user details from frontend server
    // user validations - not empty string
    // check if user already exist - email, username
    // check for images, check for avatar
    // upload image to cloudinary server - avatar required
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation success - return response

    //-----------------------------------------------------------------//

    // get user details from frontend server

    const { userName, email, fullName, password } = req.body;
    // console.log("Email:", email);
    // console.log("password:", password);

    // user validations - not empty string

    // if (fullName === "") {
    //     throw new ApiError(400, "Fullname is required");
    // }

    if (
        [userName, email, fullName, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exist - email, username

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // check for images, check for avatar

    console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required.");
    }

    // upload image to cloudinary server, avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required.");
    }

    // create user object - create entry in db - check if user is created or not
    // remove password and refresh token field from response
    // check for user creation success - return response

    const user = await User.create({
        userName: userName.toLowerCase(),
        email: email.toLowerCase(),
        fullName: fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
});

export { registerUser };
