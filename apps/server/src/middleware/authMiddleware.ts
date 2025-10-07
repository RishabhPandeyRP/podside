import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const payload = verifyToken(token, "access");
  
  if (!payload) return res.status(401).json({ message: "Invalid token" });

  // Attach user to request object
  req.user = payload; // extend Express Request type if using TS
  next();
};
