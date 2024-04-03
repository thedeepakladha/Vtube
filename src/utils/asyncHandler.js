// higher order function accept a function and also return a function

const asyncHandler = (requestHandler)=> async(req,res,next)=>{
    try {
      return  await  requestHandler(req,res,next)
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message:error.message
        })
    }
}



// also can be done using promises

// const asyncHandler = (requestHandler)=> (req,res,next)=>{
//     Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err));
// }

export {asyncHandler}