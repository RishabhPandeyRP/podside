import * as jwt from "jsonwebtoken"


interface Payload {
    userId: number,
    email: string
}

const JWT_ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET || 'MYJWTACCESSSECRET'
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'MYJWTREFRESHSECRET'
const ACCESS_TOKEN_EXPIRES_IN : number = 15 * 60 // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN : number = 7 * 24 * 60 * 60 // 7 days

export const generateAccessToken = (payload: Payload, type: string): string => {
    if (type === "access") {
        return jwt.sign(
            payload,
            JWT_ACCESS_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
        )
    } else if (type === "refresh") {
        return jwt.sign(
            payload,
            JWT_REFRESH_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        )
    }
    throw new Error("Invalid token type")
}


