require("dotenv").config();
import { ExtractJwt } from "passport-jwt";
import passport from "passport";
import { prisma } from "@repo/db";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "http://localhost:8080/auth/google/callback",
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        const { id, displayName, emails } = profile;
        const email = emails?.[0]?.value;
        if (!email) {
          return done(new Error("Email not found in profile"));
        }
        const alreadyExistingUser = await prisma.user.findFirst({
          where: {
            email,
          },
        });
        if (alreadyExistingUser) {
          return done(null, alreadyExistingUser);
        }

        // let response = await authModel.findUserByEmail(email);
        // if (response?.success) {
        //   return done(null, response.user);
        // }
        const hashedPassword = await bcrypt.hash(id, 10);
        // if (!response?.success) {
        //   await authModel.createUser(displayName, email, hashedPassword);
        // }
        const user = await prisma.user.create({
          data: {
            name: displayName,
            email: email,
            password: hashedPassword,
          },
        });
        return done(null, user);
      } catch (error) {
        console.log("error", error);
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.email);
});

passport.deserializeUser(async (email: string, done) => {
  try {
    // const user = await authModel.findUserByEmail(email);
    // done(null, user);
    const user = { email };
    console.log("deserializing user");
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const config = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "my-default-secret",
};

export { passport, config };
