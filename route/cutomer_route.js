const express = require('express');
const { getCustomer, addCustomer, updateCustomer, deleteCustomer, getCustomerById } = require('../controller/customer_controller');
const route = express.Router();
const Cutomer = require('../modelSchema/customer_model')
route.get('/customer',getCustomer);
route.post('/customer',addCustomer)
route.put('/customer:id', updateCustomer)
route.delete('/customer:id', deleteCustomer)
route.get('/customer:id',getCustomerById)
module.exports = route;

