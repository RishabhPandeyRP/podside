import { Router } from "express";
import roomController from "../controllers/roomController";

const router = Router();

router.post("/", async(req,res)=>{
    roomController.createRoom(req,res)
})

router.get("/", async(req,res)=>{
    roomController.getRoom(req,res)
})

router.get("/validate/:roomId", async(req,res)=>{
    roomController.validateRoom(req,res)
});

router.post("/joinParticipant", async(req,res)=>{
    roomController.joinParticipant(req,res)
})

router.patch("/status/:roomId" , async(req,res)=>{
    roomController.roomStatusUpdate(req,res)
})

router.get("/leaveParticipant/:roomId" , async(req,res)=>{
    roomController.leaveParticipant(req,res)
})

export default router