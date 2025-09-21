import userController from "../controllers/userController";
import { Router } from "express";
const router = Router();

router.post("/signup", async (req, res) => { userController.userSignUp(req, res) });

export default router;