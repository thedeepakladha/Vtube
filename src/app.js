import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
})); 

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser())


//import routes
import userRouter from './routes/user.routes.js'

// routes declration


// as router and controller files are at different places so we unable to use app.get instead of this we use app.use


app.use("/api/v1/users",userRouter)
// when any user go to the url /users than I provide control to the userRouter 
export {app} 