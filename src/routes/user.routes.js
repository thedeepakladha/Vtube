import {Router} from "express"
import { changeCurrentPassword, getCurrentuser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js"

import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
const router = Router()

router.route("/register").post(
    upload.fields([
       {
        name:"avatar",
        maxCount:1
       },
       {
        name:"coverImage",
        maxCount:1
       }
    ]),
    registerUser
    )

router.route("/login").post(
    loginUser
)

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
// here we are using verifyJWT middleware in all routes because want that user must be logged In

router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentuser)
router.route("/update-profile").patch(verifyJWT,updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT,upload.single('avatar'),updateUserAvatar)
router.route("/update-coverImage").patch(verifyJWT,upload.single('coverImage'),updateUserCoverImage)



export default router;