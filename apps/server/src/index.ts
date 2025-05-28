require("dotenv").config();
import express from "express";
import cors from "cors";
import { passport } from "./config/passport";
import authRouter from "./routes/auth";
import session from "express-session";
const app = express();

const port = process.env.PORT;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8080/auth/google/callback",
    ],
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", authRouter);
app.listen(port || 8000, () => {
  console.log(`Server is listening on port ${port}`);
});
