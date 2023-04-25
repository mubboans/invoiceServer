const express = require('express');
const { getInvoice, addInvoice, deleteInvoice, updateInvoice, getInvoiceByNo, getinvoicePdfbyNo, deleteSelected, readablePDF, getPaymentStatus, updateStatusinPayementDetail, webHookpaymentdetail, paymentDetailHistorybyId } = require('../controller/invoice_controller');

const route = express.Router();
route.post('/invoice',addInvoice);
route.put('/invoice:id',updateInvoice);
route.get('/invoice',getInvoice);
route.delete('/invoice:id',deleteInvoice);
route.get('/invoices:no',getInvoiceByNo);
route.get('/invoice/pdf:no',getinvoicePdfbyNo);
route.post('/invoice/delete',deleteSelected);
route.get('/invoice/:no/pdf',readablePDF);
route.get('/invoice/payment/status:id',getPaymentStatus);
route.patch('/invoice/payment/update::id',updateStatusinPayementDetail);
route.post('/invoice/webhook/detail',webHookpaymentdetail);
route.get('/invoice/payement/history/data::id',paymentDetailHistorybyId)
module.exports = route