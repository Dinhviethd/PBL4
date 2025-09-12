import  jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

const JWT_KEY= process.env.JWT_SECRET 
const ACCESS_EXPIRE= process.env.ACCESS_EXPIRE
const REFRESH_EXPIRE= process.env.REFRESH_EXPIRE

export const passwordCompare = async (password: string, hashPassword: string):Promise<boolean> => {
    return bcrypt.compare(password, hashPassword).catch(() => false);
}
export const hashPassword = async (password:string):Promise<string> => {
    return bcrypt.hash(password, 10)
}


