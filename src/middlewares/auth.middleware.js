// this middleware is just verify weather the user is present or not beacuse during the time of logout we dont have access of user 

import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandler(async(req,_,next)=>{


    // because we already added the cookieparser middleware ,by which we get access of both req.cookie and res.cookie

    // another thing is when we use multer middleware than we can easily able to use req.files and res.files

    // similarily we create our own middleware so than we can also get access of req,res

       const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
       if(!token){
        throw new ApiError(401,"Unauthorised request JWT")
       }
    
    
       // decoding the token so that we can get our user info like user id 
    
       const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
       
      const user =  await User.findById(decodedToken?._id).select("-password -refreshToken" )
       
       if(!user){
        throw new ApiError(401,"Invalid access Token JWT")
       }
       req.user = user
       // now user added to req object
       next()

})