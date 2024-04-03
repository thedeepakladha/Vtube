import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js";
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

export {registerUser}