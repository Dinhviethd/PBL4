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
// Enable CORS
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))
initDatabase()
app.use("/api", router)

// Route for root path
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the API" });
});

app.use(errorHandler.notFound)
app.use(errorHandler.errorHandler)

const PORT= process.env.PORT || 3000
app.listen(PORT, ()=> {
    console.log(`Server run at http://localhost:${PORT}`)
})