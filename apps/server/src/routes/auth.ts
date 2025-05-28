import express, { Response, Request } from "express";
import { passport } from "../config/passport";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", async (err: Error, user: any, info: any) => {
    if (err || !user) {
      return res
        .status(404)
        .json({ success: false, message: "Google Auth Failed" });
    }

    try {
      const token = jwt.sign(
        { email: user.email, id: user.id, name: user.name },
        process.env.JWT_SECRET || "hellojwt"
      );
      const userString = encodeURIComponent(JSON.stringify(jwt.decode(token)));

      return res.redirect(
        `${process.env.Frontend_Url}/success?token=${token}&user=${userString}`
      );
    } catch (error) {
      console.error("Error in signing in with google", error);
      return res.status(500).json({
        success: false,
        message: "Error in signing in with google",
      });
    }
  })(req, res, next);
});

export default router;
