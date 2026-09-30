const express = require("express")
const { registerUser, registerOperator, verifyUser, getUser, loginUser, getUserByOperator, updateUser, resolveAccount } = require("../controllers/user.contoller")
const router = express.Router()

router.post("/register", registerUser)
router.post("/register/operator", registerOperator)
router.get("/getuser", verifyUser, getUser)
router.get("/getuser/:userId", verifyUser, getUserByOperator)
router.post("/login", loginUser)
router.patch("/update/:id", verifyUser, updateUser)
router.get("user/:accountNumber", verifyUser, resolveAccount)

module.exports = router