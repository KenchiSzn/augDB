const express = require("express")
const dotenv = require("dotenv")
const app = express()
const mongoose = require("mongoose")
dotenv.config()
const cors = require("cors")
const UserModel = require("./models/user.model")
app.set("view engine", "ejs")
app.use(cors())
app.use(express.urlencoded({extended: true}));
app.use(express.json())

const userRoutes = require("./routers/user.route")
const connectDB = require("./database/connectDB")
app.use("/api/v1", userRoutes)



const URI = process.env.DB_URI
mongoose.connect(URI)
    .then(() => {
        console.log("database connected successfully");

    })
    .catch((err) => {
        console.log(err, "cannot connect to db");

    })






const PORT = process.env.PORT;
app.listen(PORT, (err) => {
    if (err) {
        console.log(err)
        console.log("cannot start server at this time");

    } else {
        console.log(`server is running on port ${PORT}`);
    }
})

module.exports = async (req, res)=>{
    await connectDB()

    return app(req, res)
}