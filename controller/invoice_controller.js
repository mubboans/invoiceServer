const invoiceSchema = require('../modelSchema/invoice_model')
const invoiceItemSchema = require('../modelSchema/invoice_item_model')
const CustomerSchema = require('../modelSchema/customer_model')
const ejs = require('ejs');
const moment = require('moment');
const puppeteer = require('puppeteer');
const {CustomError} = require('../errors/custom-error');
const payDetail = require('../modelSchema/payment_model')
const sdk = require('api')('@cashfreedocs-new/v3#he81m7ldwtny5h');
// const { PaymentGateway } = require('@cashfreepayments/cashfree-sdk');

const asyncWrapper = require('../middleware/asynwrapper');
//                         cashfreepayments/cashfree-sdk

//   cashfree.
//   cashfree.init({
//     env: "TEST", // or "PROD"
//     appId: process.env.CASHAPPID,
//     secretKey: process.env.CASHSECRETKEY
//   });

const addInvoice =asyncWrapper(async (req,res,next)=>{
    let paymentdata = req.body;
    let invoicemodel = new invoiceSchema(req.body);
    invoicemodel.custdata = invoicemodel.customerId;
    let paymentlink;
    for(let j=0;j<invoicemodel.item.length;j++){
        invoicemodel.item[j].invoice_data= invoicemodel.item[j].invoice_itemId
    }
    var d = new Date();
    invoicemodel.createdOn=moment(d).format('MM/DD/YYYY');
    var randomnum = Math.floor(Math.random() * (10000 -  2123)) + 10000;
    
   

    // invoicemodel.createdOn = d;
    let customer = await CustomerSchema.findOne({_id:invoicemodel.customerId},{_id:0,__v:0})
    // console.log(customer,customer.name,'customer');
    const userIds = req.body.item.map(user => user.invoice_itemId.replace("new ObjectId()",""));
    const quatitys=req.body.item.map(user => user.quantity);

    let Items=await invoiceItemSchema.find({_id: { $in: userIds}},{_id:0,__v: 0})
    // console.log('id check',Items);
    let totalAmount=0
    for(let i = 0;i < Items.length;i++){   
        totalAmount += Items[i].itemprice * quatitys[i]        
    }
    invoicemodel.totalamount = totalAmount;
    invoicemodel.bill_link_id = randomnum.toString();
    // console.log(userIds,'ids are',Items,quatitys,totalAmount,invoicemodel.custdata);
    let orderlink = {
        customer_details: {
            customer_phone: customer.contact,
            customer_email: customer.email,
            customer_name: customer.name
          },
          link_auto_reminders:true,
          link_notify: {send_sms:paymentdata.link_notify.send_sms, send_email:paymentdata.link_notify.send_email},
          link_id: randomnum.toString(),
          link_amount: invoicemodel.totalamount,
          link_currency: paymentdata.link_currency,
          link_purpose: paymentdata.link_purpose,
          link_partial_payments:paymentdata.link_partial_payments,
          link_minimum_partial_amount:paymentdata.link_minimum_partial_amount,
    }
    // console.log(orderlink,'check payment');
    sdk.createPaymentLink(orderlink, {
        'x-client-id': process.env.CASHAPPID,
        'x-client-secret': process.env.CASHSECRETKEY,
        'x-api-version': '2022-09-01'      
      })
        .then(data =>{
            
            console.log(orderlink,'type check')
            // const d = JSON.parse(data)  
        paymentlink = data
     let paymentDetail = new payDetail(paymentlink.data);
     paymentDetail.customerId = invoicemodel.customerId;  
     paymentDetail.save(paymentDetail,(err,obj)=>{
        if(err){
            return res.status(400).send({mesage:"Error in Saving Payment Link",success:false,error:err.message})
        }
        else{
            // console.log(obj,'save object');
            invoicemodel.paymentId=obj._id;
            invoicemodel.paymentDetail=obj._id;
            invoiceSchema.create(invoicemodel,(err,obj)=>{
                if(err){
                    res.status(400).send({message:"Can't Post Invoice",error:err.message})
                }
                else{
                    // console.log(paymentlink.data);
                    const data = {
                        message:"Added Invoice Succesfull",
                        succes:true,
                        link:paymentlink.data.link_url,
                        expireIn:paymentlink.data.link_expiry_time
                    }
                    res.status(201).send(data)
                }
            });
        }
     })
        //    console.log(paymentlink.data,orderDetail);

     
        } 
        )
        .catch(err => {console.log('error',err)
        res.status(400).send({message:"Can't Generate Link",error:err.message})  
    });
 
}
    )  
const getPaymentStatus =async(req,res,next)=>{
    let id =req.params.id;
    console.log(typeof id,'type');
    id= id.replace(":","");
   const configdata = {
  link_id: id,             
  'x-client-id': process.env.CASHAPPID,
  'x-client-secret': process.env.CASHSECRETKEY,
  'x-api-version': '2022-09-01'
} 
console.log(configdata);
   sdk.server('https://sandbox.cashfree.com/pg');

sdk.getPaymentLinkDetails(configdata)
  .then(({ data }) => res.status(200).send({message :'Successfully Fetch Status',success:true,data:data}))
  .catch(err =>res.status(400).send({message :'Failed to Fetch Status',success:false,error:err})); 
}


const updateStatusinPayementDetail = (req,res)=>{
    console.log('called 135');
        let id = req.params.id;
        let data = req.body;
        console.log(data,id);
        const updatestatuspayment = {
            link_status: data.link_status,
            link_amount_paid:data.link_amount_paid
        }
        payDetail.findOneAndUpdate({ _id: id }, updatestatuspayment, (err, obj) => {
            if (err) {
                console.log(err,'err');
             return res.status(400).send({ message: "Can't Update Status in payment", success: false, error: err });
            }
            else {
                console.log(obj,'update');
                  res.status(200).send({ message: "Successfull Update Status in Payment", success: true , status:'Success' });
              
            }
        })
    
    
    
}

const deleteSelected = async (req,res,next)=>{
    let ids = req.body.ids
    console.log(ids);
    invoiceSchema.deleteMany({ _id:{ $in: ids }},(err,obj)=>{
        if(err){
            res.status(400).send({message:"Can't Delete Invoices with Ids",error:err})  
        }
        else{
            let datalength = 0;
            if (ids.length > 0){
                datalength = ids.length > 0 ? ids.length : 0; 
            }
            res.status(200).send({message:"Delete Selected Invoice Successfully",succes:true,deleted:`Total record Deleted ${datalength}`})
        }
    }  
    )
}

const updateInvoice =async(req,res,next)=>{
    let id =req.params.id
    id = id.replace(":",""); 
    let invoicemodel = new invoiceSchema(req.body)
    const userIds = req.body.item.map(user => user.invoice_itemId.replace("new ObjectId()",""));
    const quatitys=req.body.item.map(user => user.quantity);
    let Items=await invoiceItemSchema.find({_id: { $in: userIds}},{_id:0,__v: 0})
    for(let j=0;j<invoicemodel.item.length;j++){
        invoicemodel.item[j].invoice_data= invoicemodel.item[j].invoice_itemId
    }
    let totalAmount=0
    for(let i = 0;i < Items.length;i++){   
        totalAmount += Items[i].itemprice * quatitys[i]        
    }
    let updatedinvoice = {
        customerId:invoicemodel.customerId,
        custdata:invoicemodel.customerId,
        item:invoicemodel.item,
        invoicedate:invoicemodel.invoicedate,
        totalamount:totalAmount
    }

    // let invoicemodel = new invoiceSchema({
    //     customerId:req.body.customerId,
    //     item:req.body.item,
    //     invoicedate:req.body.invoicedate
    // });
    console.log(updatedinvoice,'update');
    invoiceSchema.findByIdAndUpdate({_id:id}, { $set: {                // <-- set stage
        customerId:invoicemodel.customerId,
        custdata:invoicemodel.customerId,
        item:invoicemodel.item,
        invoicedate:invoicemodel.invoicedate,
        totalamount:totalAmount
       } 
     },(err,obj)=>{
        if(err){
            res.status(400).send({message:"Can't Update Invoice",error:err.message})
        }
        else{
            console.log(obj,'obj');
            res.status(200).send({message:"Update Invoice Successfully",succes:true})
        }
    })
}
const getinvoicePdfbyNo = async (req,res,next)=>{
    let no = req.params.no;
    no= no.replace(":","");
    
    let data = await invoiceSchema.find({invoiceno:no}).populate([{path:'custdata'},{path:'item.invoice_data'}])
    invoiceSchema.findOne({invoiceno:no},async (err,obj)=>{
        if(err){
            return res.status(500).send({message:"Can't Find Invoice With Number",erroor:err.message})
        }
        else{
            customerid= data[0].customerId
            let Customer =await CustomerSchema.find({_id:customerid},{_id:0,__v:0})
          
            const detailed = {
                name:Customer[0].name,
                email:Customer[0].email,
                contact:Customer[0].contact,
                address:Customer[0].address,
                items:data[0].item,
                inno:data[0].invoiceno,
                amount:data[0].totalamount,
                indate:data[0].invoicedate,
                itemlength:data[0].item.length,
                createddate:data[0].createdOn
            }
            // res.set('Content-Type', 'text/html;charset=utf-8');
            // console.log(detailed,'detail check',);
            // const html = await ejs.renderFile('./views/invoice.ejs', {detail:detailed,allitem:data[0].item});
            // res.set('Content-Type', 'application/pdf');
          
            res.status(200).render("invoice",{detail:detailed,allitem:data[0].item})
            // res.status(200).render("invoice-check",{detail:detailed,allitem:data[0].item})
            // res.status(200).download(path.join('views/invoice.ejs'));
        }
    })
}
const readablePDF= async (req,res,next)=>{

        let no = req.params.no;
        no= no.replace(":","");
        
        let data = await invoiceSchema.find({invoiceno:no}).populate([{path:'custdata'},{path:'item.invoice_data'}])
        invoiceSchema.findOne({invoiceno:no},async (err,obj)=>{
            if(err){
                // return next(CreateCustomError("Can't Find Invoice With Number",400))                
                return res.status(500).send({message:"Can't Find Invoice With Number",erroor:err.message})
            }
            else{
                if(obj == null){
                    const d=new CustomError("Can't Find Invoice With Number",404); 
                    return res.status(d.statusCode).send({message:"Can't Find Invoice With Number",error:d.message})
                }
                console.log(obj,'data check');
                customerid= data[0].customerId
                let Customer =await CustomerSchema.find({_id:customerid},{_id:0,__v:0})

                const detailed = {
                    name:Customer[0].name,
                    email:Customer[0].email,
                    contact:Customer[0].contact,
                    address:Customer[0].address,
                    items:data[0].item,
                    inno:data[0].invoiceno,
                    amount:data[0].totalamount,
                    indate:data[0].invoicedate,
                    itemlength:data[0].item.length,
                    createddate:data[0].createdOn,
                    id:data[0]._id,
                }
                console.log(detailed);

                const html = await ejs.renderFile('./views/read-invoice.ejs', {detail:detailed,allitem:data[0].item,invoiceno:data[0].invoiceno});
                res.set('Content-Type', 'application/pdf');
                const browser = await puppeteer.launch(); // launch puppeteer
                const page = await browser.newPage(); // create a new page
                await page.setContent(html); // set the html content to your page
                const pdfBuffer = await page.pdf({format: 'A4'}); // generate a pdf buffer from your page
                await browser.close(); // close puppeteer
                // res.type('application/pdf'); // set the response type to pdf
                res.send(pdfBuffer);
                // res.status(200).render("invoice",{detail:detailed,allitem:data[0].item})
                // res.status(200).render("invoice-check",{detail:detailed,allitem:data[0].item})
                // res.status(200).download(path.join('views/invoice.ejs'));
            }
        })
    
}
const getInvoice= (req,res,next)=>{
    invoiceSchema.find().sort({ _id: -1 }).populate([
      {
        path: 'custdata',
      },{
        path: 'item.invoice_data',
      },{
        path:'paymentDetail'
      }]).exec( function (err, obj) {
        if(err){
            return res.status(400).send({message:"Can't find Invoice",error:err.message})
        }
        else{
            return res.status(200).send({message:"Get Invoice Successfully",data:obj,succes:true})
        }
    })
   
}
const getInvoiceByNo = (req,res,next)=>{
    let no =req.params.no;
    no= no.replace(":","")
    invoiceSchema.find({invoiceno:no}).populate([{
        path: 'custdata',
      },{
        path: 'item.invoice_data'
      }]).exec((err,obj)=>{
        if(err){
            return res.status(400).send({message:"Can't find Invoice By Number",error:err.message})  
        }
        else{
            return res.status(200).send({message:"Get Invoice By Number",data:obj,succes:true})
        }
    })
}
 const deleteInvoice = (req,res,next)=>{
    let id =req.params.id
    id = id.replace(":","");
    invoiceSchema.findByIdAndDelete({_id:id},(err,obj)=>{
        if(err){
            res.status(400).send({message:"Can't Delete Invoice",error:err})
        }
        else{
            res.status(200).send({message:"Delete Invoice Successfully",succes:true})
        }
    })

 }

module.exports = {
    addInvoice,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceByNo,
    getinvoicePdfbyNo,
    deleteSelected,
    readablePDF,
    getPaymentStatus,updateStatusinPayementDetail
}