const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const invoiceSchema = new Schema({
    customerId: { 
        type: String, ref: "customer" 
    },
    custdata:{
        type: Schema.Types.ObjectId, ref: "customer" 
    },
    invoiceno: {
        type: Number,
        require: true, index:true, unique:true,sparse:true
    },
    invoicedate: {
        type: Date,
        default:new Date()
    },
    createdOn:{
        type:Date,
    },
    item: [{
        invoice_itemId: { 
            type: String,
         },
          invoice_data: { 
            type: Schema.Types.ObjectId, ref: "invoice_item"
         },

        quantity: {
            type: Number,
            required:true
        }
    }
    ],
    paymentType:{
        type:Number,
        required:true
    },
    bill_link_id:{
        type:String,
        require:true
    },
    isPartialPayemnt:{
        type:Boolean,
        default:false
    },
    totalamount: {
        type: Number
    },
    paymentId:{
        type:String,
        required:true
    },

    paymentDetail:{
        type: Schema.Types.ObjectId, ref: "paymentDetail" 
    }
});

module.exports = mongoose.model('invoice', invoiceSchema)
