import User from '../models/User.model.js'
import { sendOTPEmail } from '../utils/email.js';
import OTP from '../models/OTP.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'

const generateToken = (id, role) => {
    return jwt.sign({id, role}, process.env.JWT_SECRET, {expiresIn: '7d'})
}

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please enter all details" })
        }

        const userExist = await User.findOne({ email });

        if (userExist) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const user = new User({ name, email, password, role: 'user', isVerified: false })
        await user.save();

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`OTP from ${email}: ${otp}`);
        await OTP.create({ email, otp, action: 'account_verification' })
        await sendOTPEmail(email, otp, 'account_verification')

        res.status(201).json({
            message: "User Registered Successfully. Please check your email for OTP to verify your account.",
            
            id: user._id,
            name: user.name,
            email: user.email,
            role: 'user',
            isVerified: false,
            success: true, 
        })

    } catch (error) {
        res.status(500).json({ error: error.message, message: "Registration Failed", success: false })
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Please enter all details" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials Please Sign Up" })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        if (!user.isVerified && user.role === 'user') {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await OTP.deleteMany({ email, action: 'account_verification' })
            await OTP.create({ email, otp, action: 'account_verification' })
            await sendOTPEmail(email, otp, 'account_verification')

            return res.status(403).json({
                needsVerification: true,
                message: "Account not verified. A new OTP has been sent to your email."
            })
        }

        res.status(200).json({
            message: "User Logged In Successfully.",
            success: true,
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role)
        })

    } catch (error) {
        res.status(500).json({ error: error.message, message: "Login Failed" })
    }
};

export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const otpRecord = await OTP.findOne({
            email,
            otp: otp,
            action: 'account_verification'
        });

        if (!otpRecord) {
            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }

        const user = await User.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        await OTP.deleteMany({
            email,
            action: 'account_verification'
        });

        return res.status(200).json({
            message: "Account verified successfully",
            success: true,
            isVerified: true, 
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role)
        });

    } catch (error) {
        return res.status(500).json({
            message: "OTP verification failed",
            error: error.message
        });
    }
};