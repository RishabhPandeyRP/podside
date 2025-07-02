import { Router } from "express";
import roomRoutes from "./room"

const router = Router();

router.use("/room" , roomRoutes);

export default router