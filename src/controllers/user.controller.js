import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js";

import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/user.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();

        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh Token"
        );
    }
};

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

const loginUser = asyncHandler(async (req, res) => {
    // req body - data
    // username or email address for login
    // find the user
    // password check
    // access & refresh token
    // send secure cookies and send response

    // req body - data
    // username or email address for login

    const { email, userName, password } = req.body;

    if (!(userName || email)) {
        throw new ApiError(400, "Username or email is required");
    }

    // find the user

    const user = await User.findOne({
        $or: [{ userName }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // password check

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    // access & refresh token

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    // send secure cookies and send response

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User Logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    // req.user - logged in user
    // remove access and refresh token from user
    // send response

    // req.user - logged in user

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"));
});

export { registerUser, loginUser, logoutUser };
