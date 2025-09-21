import { Router } from "express";
import roomRoutes from "./room"
import userRoutes from "./user"

const router = Router();

router.use("/room" , roomRoutes);
router.use("/user" , userRoutes);

export default router