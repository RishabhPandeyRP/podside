import userController from "../controllers/userController";
import { Router } from "express";
const router = Router();

router.post("/signup", async (req, res) => { userController.userSignUp(req, res) });
router.post("/login", async (req, res) => { userController.userLogin(req, res) });
router.get("/", async (req, res) => { userController.getAllUsers(req, res) });
router.post("/refresh", async (req, res) => { userController.refreshAccessToken(req, res) });

export default router;