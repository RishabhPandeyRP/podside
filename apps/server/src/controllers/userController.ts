import { getAlluser, refreshAccessToken, userSignUp } from "../services/userService";
import { userLogin } from "../services/userService";
import { Request, Response } from "express";

const userController = {
    userSignUp: async (req: Request, res: Response) => {
        const { email, name, password } = req.body;
        try {
            if (!email || !name || !password) {
                return res.status(400).json({ message: "Email, name, and password are required" });
            }
            const result = await userSignUp(email, name, password);
            if (!result.success) {
                return res.status(400).json({ message: result.message });
            }
            return res.status(201).json({ message: result.message, user: result.user });
        } catch (error) {
            console.error("Error during user sign-up:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    userLogin: async (req: Request, res: Response) => {
        const { email, password, device, ipAddress } = req.body;
        try {
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }
            const result = await userLogin(email, password, device, ipAddress);
            if (!result.success) {
                return res.status(400).json({ message: result.message });
            }
            res.cookie("accessToken", result.accessToken, {
                httpOnly: true,                // protect against XSS
                secure: process.env.NODE_ENV === "production", // HTTPS only in prod
                sameSite: "strict",            // CSRF protection
                maxAge: 15 * 60 * 1000,        // 15 minutes
                path: "/api",                  // only sent with API requests
                priority: "high",
            });

            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,                 // no JS access → XSS protection
                secure: process.env.NODE_ENV === "production", // HTTPS only in prod
                sameSite: "strict",             // CSRF protection
                maxAge: 7 * 24 * 60 * 60 * 1000,// 7 days
                path: "/api/auth/refresh",      // refresh token only sent for refresh route
                priority: "high",               // browser eviction policy
            });
            return res.status(200).json({ message: result.message, user: result.user });
        } catch (error) {
            console.error("Error during user login:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    getAllUsers: async (req: Request, res: Response) => {
        try {
            const users = await getAlluser();
            return res.status(200).json(users);
        } catch (error) {
            console.error("Error fetching users:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    refreshAccessToken: async (req: Request, res: Response) => {
        const { email, refreshToken } = req.body;
        try {
            if (!email || !refreshToken) {
                return res.status(400).json({ message: "Email and refresh token are required" });
            }
            const result = await refreshAccessToken(email, refreshToken);
            if (!result.success) {
                return res.status(400).json({ message: result.message });
            }
            res.cookie("accessToken", result.accessToken, {
                httpOnly: true,                // protect against XSS
                secure: process.env.NODE_ENV === "production", // HTTPS only in prod
                sameSite: "strict",            // CSRF protection
                maxAge: 15 * 60 * 1000,        // 15 minutes
                path: "/api",                  // only sent with API requests
                priority: "high",
            });

            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,                 // no JS access → XSS protection
                secure: process.env.NODE_ENV === "production", // HTTPS only in prod
                sameSite: "strict",             // CSRF protection
                maxAge: 7 * 24 * 60 * 60 * 1000,// 7 days
                path: "/api/auth/refresh",      // refresh token only sent for refresh route
                priority: "high",               // browser eviction policy
            });
            return res.status(200).json({ message: result.message, accessToken: result.accessToken, refreshToken: result.refreshToken });
        } catch (error) {
            console.error("Error refreshing access token:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
};

export default userController;