import { prisma } from "@repo/db"
import { generateAccessToken } from "../utils/token"
import * as bcrypt from "bcryptjs"

export async function userSignUp(email:string, name:string , password:string){
    const existingUser = await prisma.user.findUnique({
        where:{
            email:email
        }
    })
    if(existingUser){
        return {success:false, message:"User already exists"}
    }
    const user = await prisma.user.create({
        data:{
            email,
            name,
            password
        }
    })

    return {success:true, message:"User created successfully", user}

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
    const isPasswordValid = await bcrypt.compare(password, user.password)
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
    
    return {success:true, message:"User logged in successfully", user , accessToken, refreshToken}
}