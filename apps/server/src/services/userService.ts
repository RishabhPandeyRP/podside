import { prisma } from "@repo/db"
import { generateAccessToken, verifyToken } from "../utils/token"
import argon2 from "argon2"

export async function userSignUp(email:string, name:string , password:string){
    const existingUser = await prisma.user.findUnique({
        where:{
            email:email
        }
    })
    if(existingUser){
        return {success:false, message:"User already exists"}
    }

    const pepper = process.env.PEPPER || "";
    const ARGON2_OPTIONS = {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 5,
        parallelism: 1,
    };
    const hashedPassword = await argon2.hash(password + pepper, ARGON2_OPTIONS);    

    const user = await prisma.user.create({
        data:{
            email,
            name,
            password: hashedPassword
        }
    })

    return {
        success: true,
        message: "User created successfully",
        user:{
            userId: user.id,
            email: user.email,
            name: user.name
        }
    }

}

export async function userLogin(email:string, password:string, device?:string, ipAddress?:string){
    const user = await prisma.user.findUnique({
        where:{
            email
        }
    })
    if(!user){
        return {success:false, message:"User does not exist"}
    }
    console.log("hint")
    console.log("Login input:", { password, pepper: process.env.PEPPER });

    const isPasswordValid = await argon2.verify(user.password, password + (process.env.PEPPER || ""));
    if(!isPasswordValid){
        return {success:false, message:"Invalid password"}
    }

    const accessToken = generateAccessToken({userId: user.id, email: user.email} , "access")
    const refreshToken = generateAccessToken({userId: user.id, email: user.email} , "refresh")

    await prisma.refreshToken.create({
        data:{
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            device,
            ipAddress
        }
    })
    
    return {
        success: true,
        message: "User logged in successfully",
        user: {
            userId: user.id,
            email: user.email,
            name: user.name
        },
        accessToken,
        refreshToken
    }
}

export async function getAlluser(){
    const users = await prisma.user.findMany();
    const sanitizedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }));
    return sanitizedUsers;
}

export async function refreshAccessToken(refreshToken: string) {
    // const user = await prisma.user.findUnique({
    //     where: {
    //         email: email
    //     }
    // });
    // if (!user) {
    //     return { success: false, message: "User does not exist" };
    // }
    const userPayload = verifyToken(refreshToken, "refresh");

    if (!userPayload) {
        return { success: false, message: "Invalid or expired refresh token" };
    }

    const storedToken = await prisma.refreshToken.findUnique({
        where: {
            token: refreshToken
        }
    });


    if (!storedToken || storedToken.userId !== userPayload?.userId || storedToken.revoked || storedToken.expiresAt < new Date()) {
        return { success: false, message: "Invalid or expired refresh token" };
    }

    const newAccessToken = generateAccessToken({userId: userPayload?.userId, email: userPayload?.email} , "access")
    const newRefreshToken = generateAccessToken({userId: userPayload?.userId, email: userPayload?.email} , "refresh")

    await prisma.refreshToken.create({
        data:{
            token: newRefreshToken,
            userId: userPayload?.userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
    })
    
    await prisma.refreshToken.update({
        where:{
            token: refreshToken
        },
        data:{
            revoked: true
        }
    })
    return {
        success: true,
        message: "Token refreshed successfully",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    }
}

export async function getMe(userId: number) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true
        }
    });
    if (!user) {
        return { success: false, message: "User not found" };
    }
    return { success: true, user };
}
