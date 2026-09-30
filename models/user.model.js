const mongoose = require ('mongoose')

const UserSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true, },
    password: { type: String, required: true, select:false},
    tag: {type: String, sparse:true, unique:true},
    isVerified : {type: Boolean, default: false},
    verificationCode: {type: String},
    role: { type: String, default: "user", enum: ["user", "operator", "admin"]},
    accountNumber: {type: String, sparse:true, unique:true},
    balance: {type: Number, required: true, default: 10000}, 
    // profilePicture: {
        
    // }
}, {timestamps: true, strict: "throw" })

const UserModel = mongoose.model('user', UserSchema)
module.exports = UserModel