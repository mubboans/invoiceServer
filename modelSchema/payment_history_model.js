const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paymentHistory = new Schema({

    payementId:{
        type: Schema.Types.ObjectId, ref: "paymentDetail" 
    },
    paymentData:{
        type: Schema.Types.ObjectId, ref: "paymentDetail" 
    },
    amount:{
        type:Number,
        default:0
    },
    createdDate:{
    type:Date,
    default:Date.now()
    }
},{ timestamps: true })
module.exports=mongoose.model('paymentHistory',paymentHistory)