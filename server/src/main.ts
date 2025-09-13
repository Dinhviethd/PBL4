import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import  router  from './routes/index'
import { initDatabase } from '@/configs/database.config'
import errorHandler from "@/middlewares/errorHandlermiddleware";
dotenv.config()
const app= express()
app.use(express.json({limit:"5mb"}));
app.use(express.urlencoded( {extended: true }))
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["POST", "PUT", "GET", "DELETE"],
}))
initDatabase()
app.use("/api", router)
app.use(errorHandler.notFound)
app.use(errorHandler.errorHandler)

const PORT= process.env.PORT || 3000
app.listen(PORT, ()=> {
    console.log(`Server run at http://localhost:${PORT}`)
})