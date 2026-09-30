
const UserModel = require("../models/user.model")

const transferFunds = async (req, res) =>{
    const {accountNumber, amount, description} = req.body
    const {id} = req.user

     try {
            const receiver = await UserModel.findOne({accountNumber})
            if (!receiver){
                res.status(404).send({
                    message: "Cannot resolve account number",
                });
                return;
            }
            
            const transaction = await TransactionModel.create({
                
            })
            
        } catch (error) {
             res.status(500).send({
                    message: "Account doesn't exit",
                });
                return;
        }
}

module.exports = {
    transferFunds
}