import { v2 as cloudinary} from "cloudinary";
import fs from 'fs'

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET

})

const uploadOnCloudinary = async (localFilePath)=>{
   try {
    if(!localFilePath){
        console.error(`Could No Find The Path!!!`)
        return null;
    }
    // uploading the file on cloudinay
  const response =  await cloudinary.uploader.upload(localFilePath,{
        resourse_type:"auto"
    })

    // file has been uploaded successfully Now
    fs.unlinkSync(localFilePath)
    return response;

   } catch (error) {
    // if files are not able to upload on cloudinay than they must be unlinked from local server 
    // remove the locally saved temporary file as the upload operation failed
    fs.unlinkSync(localFilePath)

    return null;
   }
}

export {uploadOnCloudinary} 