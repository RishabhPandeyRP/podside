import { userSignUp } from "../services/userService";
import { Request, Response } from "express";

const userController = {
    userSignUp: async (req:Request, res:Response) => {
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
    }
};

export default userController;