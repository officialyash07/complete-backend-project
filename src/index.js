// require("dotenv").config({ path: "./env" });

import dotenv from "dotenv";

import connectDB from "./db/index.js";

dotenv.config({
    path: "./env",
});

connectDB();

// ------------------------------------------------------------------------------------------------//

// First approach to connect to the database.

// import express from "express";

// import mongoose from "mongoose";

// import { DB_NAME } from "./constants";

// const app = express();

// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//         app.on("error", (error) => {
//             console.log("Error: ", error);
//             throw error;
//         });

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on ${process.env.PORT}`);
//         });
//     } catch (error) {
//         console.log("ERROR: ", error);
//         throw error;
//     }
// })();

// ------------------------------------------------------------------------------------------------//
