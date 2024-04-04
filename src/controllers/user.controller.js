import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) =>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave:false})
    return {accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500,"Something went wrong whike generating refersh and access token")
  }
}


const registerUser = asyncHandler(async (req,res)=>{
     // get user detail from frontend
     //validation (no empty input)
     //check if user already exists:username or email
     // check for images ,check for avatar
     // if avalible than upload them into cloudinary
     // check avatar is properly uploaded or not because avatar is required
     // create user object - create entry in db
     //remove password and refresh token from response 
     // check weather user creation or not (mean you need to check response aaya h ya nhi)
     //return response to frontend

//step 1:   // get user detail from frontend
    const {fullname,email,username,password} = req.body;
    //  if(fullname === ""){
    //     throw new ApiError(400,"Fullname is required")
    //  }

    // step 2 : validation (no empty input)
    
    if(
        [fullname,email,username,password].some((field)=>
    field?.trim() === ""
        )
    ){
            throw new ApiError(400,"All fields are required")
    }

    //step 3: check if user already exists:username or email
  const existedUser =  await User.findOne({
    $or:[{email},{username}]
   })

   if(existedUser){
    throw new ApiError(409,"User with email or username already exist")
   }

   // step 4: check for images ,check for avatar
  // basically middleware has work to add new filds in req
  //  express provide req.body excess similarily multer provide excess of req.files
   // multer give access of req.files
   const avatarLocalPath = req.files?.avatar[0]?.path;
  //  const coverImageLocalPath= req.files?.coverImage[0]?.path;
  
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
   }


   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar is required")
   }

  

   // step 5 : upload them into cloudinary 
  const avatar =  await uploadOnCloudinary(avatarLocalPath)
  const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

  // step 6 : check avatar is properly uploaded or not because avatar is required

  if(!avatar){
    throw new ApiError(400,'Avatar is requiredd')
  }



  // step 7 : object make for to store in database
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()

  })
// because we want ki user or frontend ko password and refresh token nah bheje as respnse
 const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
 )

   // step8 : check user creation compelete or not in database
 if(!createdUser){
    throw new ApiError(500,"something went wrong while registering the user")
 }


  // step 9: returning back the reponse to frontend 
    return res.status(201).json(
      new ApiResponse(200,createdUser,"User Registered Successfully")
    )

})


const loginUser = asyncHandler(async(req,res)=>{
 // take data from req.body
 // username or email
 // find the user
 // password check
 // access and refresh token generate and send to user
 // send these tokens into cookie
 // scuccessfully login


 const {email,username,password} = req.body;
 if(!username && !email){
    throw new ApiError(400,"Username or email is required")
 }

 // finding the user using either email or username in database
 const user = await User.findOne({
  $or:[{email},{username}]
 })

 if(!user){
  throw new ApiError(404,"User does not exist")
 }

 
 

const isPasswordValid = await user.isPasswordCorrect(password)


if(!isPasswordValid){
  throw new ApiError(401,"password invalid")
 }



 // if user has correct password now access and refresh token work done
const {accessToken,refreshToken} =  await generateAccessAndRefreshTokens(user._id)

// Now send them to cookie as well because we already send refresh token into database

  // optional statement
const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


const options = {
  httpOnly: true,  // No you cant able to modify this cookie only server can able  to modified it,thats the reason why jwt is better than session authentication
  secure:false

}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(
      200,
  {
    user:loggedInUser,accessToken,refreshToken
  },
  "User loggedIn Successfully"

    )
)


})


const logoutUser = asyncHandler(async(req, res) => {


  await User.findByIdAndUpdate(
      req.user._id,
      {
          $unset: {
              refreshToken: 1 // this removes the field from document
          }
      },
      {
          new: true
      }
  )


  const options = {
      httpOnly: true,
      secure: false,

  }


  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})


const refreshAccessToken = asyncHandler(async(req,res)=>{
  // refresh token from user side
  const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorised Request")
  }
  // As we always send token to frontend in encoded form
  // so we have to verify it with our database 
 const decodedToken =  jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 // Now this refresh token in decoded and we can access any thing from this refresh token like id
 // if we have id information than we can also get information of user in database

 const user =  await User.findById(decodedToken?._id)
 if(!user){
  throw new ApiError(401,"Invalid Refresh Token")
}
// as we also knnw that there is also a refresh token in user as well so compare incommingRefreshToken with that 

if(incomingRefreshToken !== user?.refreshToken){
  throw new ApiError(401,"Refresh Token is expired or used")
}

// Now all verification done generate new refresh and access token

const options = {
  httpOnly: true,
  secure:false
}
const {accessToken,newrefreshToken} =  await generateAccessAndRefreshTokens(user._id)

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",newrefreshToken,options)
.json(
  new ApiResponse(
    200,
    {accessToken,refreshToken:newrefreshToken},
    "Access and Refresh Token Refreshed"
  )
)

})

export {registerUser,loginUser,logoutUser,refreshAccessToken}