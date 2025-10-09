import { getAlluser, refreshAccessToken, userSignUp, logout } from "../services/userService";
import { userLogin } from "../services/userService";
import { Request, Response } from "express";
import { verifyToken } from "../utils/token";

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
                sameSite: process.env.NODE_ENV === "production" ? "strict":"lax",  // CSRF protection
                maxAge: 15 * 60 * 1000,        // 15 minutes
                path: "/",                  // only sent with / requests from FE
                priority: "high",
            });

            res.clearCookie("refreshToken", { path: "/" });
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,                 // no JS access → XSS protection
                secure: process.env.NODE_ENV === "production", // HTTPS only in prod
                sameSite: process.env.NODE_ENV === "production" ? "strict":"lax",   // CSRF protection
                maxAge: 7 * 24 * 60 * 60 * 1000,// 7 days
                path: "/",      // refresh token only sent for / route from FE
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
        const refreshToken = req.cookies.refreshToken;
        console.log("Received refresh token:", refreshToken);
        try {
            if (!refreshToken) {
                return res.status(400).json({ message: "Email and refresh token are required" });
            }
            const result = await refreshAccessToken(refreshToken);
            if (!result.success) {
                return res.status(400).json({ message: result.message });
            }
            res.cookie("accessToken", result.accessToken, {
                httpOnly: true,                // protect against XSS
                secure: process.env.NODE_ENV === "production", // HTTPS only in prod
                sameSite: process.env.NODE_ENV === "production" ? "strict":"lax",            // CSRF protection
                maxAge: 15 * 60 * 1000,        // 15 minutes
                path: "/",                  // only sent with API requests
                priority: "high",
            });

            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,                 // no JS access → XSS protection
                secure: process.env.NODE_ENV === "production", // HTTPS only in prod
                sameSite: process.env.NODE_ENV === "production" ? "strict":"lax",            // CSRF protection
                maxAge: 7 * 24 * 60 * 60 * 1000,// 7 days
                path: "/",      // refresh token only sent for refresh route
                priority: "high",               // browser eviction policy
            });
            return res.status(200).json({ message: result.message, accessToken: result.accessToken, refreshToken: result.refreshToken });
        } catch (error) {
            console.error("Error refreshing access token:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    getMe: async (req: Request, res: Response) => {
        const token = req.cookies.accessToken;
        try {
            if (!token) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const user = await verifyToken(token, "access");
            if (!user) {
                return res.status(401).json({ message: "Invalid or expired token" });
            }
            
            return res.status(200).json({user});
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    logout: async (req: Request, res: Response) => {
        const userId = req.body.userId;
        try {
            await logout(userId);
            res.clearCookie("accessToken", { path: "/" });
            res.clearCookie("refreshToken", { path: "/" });
            return res.status(200).json({ message: "Logged out successfully" });
        } catch (error) {
            console.error("Error during logout:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },
};

export default userController;