import configs from "../config/config.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import User from "../models/user.js";
import ErrorHandler from "../utilities/errorHandler.js";
import sendToken from "../utilities/sendToken.js";
import sendEmail from "../utilities/sendEmail.js";
import { getResetPasswordTemplate } from "../utilities/emailTemplate.js";
import crypto from "crypto";

// Register a user   =>   /api/v1/register
export const registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;

    const user = await User.create({
        name,
        email,
        password,
    });

    sendToken(user, 201, res)
});

// Login user   =>   /api/v1/login
export const loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please enter email & password", 400))
    }

    // Find user in the database
    const user = await User.findOne({ email }).select("+password")

    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401))
    }

    // Check if password is correct
    const isPasswordMatched = await user.comparePassword(password);

    console.log("password Matched:", isPasswordMatched)

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401))
    }

    sendToken(user, 200, res)
});


export const logoutUser = catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        message: "Logged out",
    });
});

// Forgot password   =>   /api/v1/password/forgot
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {

    // Find user in the database
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new ErrorHandler("User not found with this email", 404));
    }

    // Get reset password token
    const resetToken = user.getResetPasswordToken()

    await user.save()

    // Create reset password url
    const resetUrl = configs.frontendUrl + `/api/v1/password/reset/${resetToken}`;

    const message = getResetPasswordTemplate(user?.name, resetUrl);

    try {
        await sendEmail({
            email: user.email,
            subject: "GetNow Password Recovery",
            // message,
            htmlMessage: message
        });

        res.status(200).json({
            message: `Email sent to: ${user.email}`
        });

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        return next(new ErrorHandler(error?.message, 500))
    }

});

// Reset password   =>   /api/v1/password/reset/:token
export const resetPassword = catchAsyncErrors(async (req, res, next) => {

    // Hash URL token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorHandler("Password reset token is invalid or has been expired", 400));
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password does not match", 400));
    }

    // Set the new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res)
});