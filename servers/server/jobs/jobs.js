/**
 * @Author: Mathew Black <Mathew>
 * @Date:   2019-12-01T14:40:26-06:00
 * @Email:  dev@mathewblack.com
 * @Filename: jobs.js
 * @Last modified by:   Mathew
 * @Last modified time: 2019-12-04T15:36:41-06:00
 * @License: MIT
 */

var Agenda = require('agenda')

const mongodb_url = process.env.MONGODB_URL || "mongodb://localhost:27017/hodl"
const mongoose = require('mongoose')
 mongoose.set('debug', true);
const agenda_db_url = mongodb_url.substring(0, mongodb_url.lastIndexOf('/')) + "/agenda";
var agenda = new Agenda({db: {address: agenda_db_url}})
const jwt = require('jsonwebtoken')
const base_exchange_url =  process.env.EXCHANGE_URL || "http://localhost:4000/stock_api"
const axios = require('axios')

const Stock = require('../models/Stock-model')
const Users = require('../models/Users-model')
const Balance = require('../models/Balance-model')

async function auth (token) {
  try {
      const decoded_token = jwt.verify(token, process.env.JWT_SECRET || "replaceme")
      const user = await Users.findOne({ _id: decoded_token._id, 'tokens.token': token })
      if (!user) {
          return null
      }
      return decoded_token
  } catch (e) {
      console.error('could not login')
      return null
  }
}

 agenda.define('buyStock', async (job) => {
   console.log('buying stock')
   var token = await auth(job.attrs.data.token)
   if (!token) {
     job.fail("could not login")
     await job.remove()
     return;
   }
   var stock = job.attrs.data.stock
   stock.quantity  = parseFloat(stock.quantity)
   if (job.attrs.data.end_datetime) {
     const end_datetime = new Date(job.attrs.data.end_datetime).getTime()
     if (end_datetime < Date.now()) {
       try {
         console.log('Time ended on job', job.attrs._id, 'deleting')
         await job.remove();
       }
       catch (e) {
         console.error(e)
         job.fail(e)
       }
     }
   }
   try {
     var balance = await Balance.findOne({
       user_id: stock.user_id
     })
     var response = await axios.post(`${base_exchange_url}/stocks/latest/${stock.stock_indicator}`,{token:job.attrs.data.token})
     const price = response.data.price
     const new_amount = balance.amount - stock.quantity*price
     console.log(new_amount)
     if (new_amount < 0) {
       console.log('Did not have enough money to make transaction')
       await job.remove();
       return;
     }
     var response = await Balance.updateOne({
       user_id: stock.user_id
     }, {
       amount: new_amount
     })
   }
   catch (e) {
     console.error(e)
     job.fail(e)
     return;
   }
   var old_stock;
   try{
     old_stock = await Stock.findOne({
       user_id: stock.user_id,
       stock_indicator: stock.stock_indicator
     })
   }
   catch (e) {
     console.error('could not find original stock', e)
     job.fail(e)
   }
   const quantity = old_stock ? old_stock.quantity + stock.quantity : stock.quantity
   try {
     const result = await Stock.updateOne({
       user_id: stock.user_id,
       stock_indicator: stock.stock_indicator
     }, {
       user_id: stock.user_id,
       stock_indicator: stock.stock_indicator,
       quantity: quantity
     }, {upsert:true});
     console.log(result);
   }
   catch(e) {
     console.error('could not update stock', e)
     job.fail(e)
   }


 });

 agenda.define('sellStock', async (job) => {
   console.log("selling stock!")
   var stock = job.attrs.data.stock
   var token = await auth(job.attrs.data.token)
   if (!token) {
     console.error('could not login')
     job.fail("could not login")
     await job.remove()
     return;
   }
   stock.quantity  = parseFloat(stock.quantity)
   if (job.attrs.data.end_datetime) {
     const end_datetime = new Date(job.attrs.data.end_datetime).getTime()
     if (end_datetime < Date.now()) {
       try {
         console.log('Time ended on job', job.attrs._id, 'deleting')
         await job.remove();
       }
       catch (e) {
         console.error(e)
         job.fail(e)
         return;
       }
     }
   }

   try{
     var old_stock = await Stock.findOne({
       user_id: stock.user_id,
       stock_indicator: stock.stock_indicator
     })
   }
   catch (e) {
     console.error('could not find original stock', e)
     job.fail(e)
     return;
   }

   if (old_stock && old_stock.quantity - stock.quantity < 0) {
     console.log('Did not have enough stock to make transaction')
     await job.remove();
     return;
   }

   try {
     var balance = await Balance.findOne({
       user_id: stock.user_id
     })
     var response = await axios.post(`${base_exchange_url}/stocks/latest/${stock.stock_indicator}`,{token:job.attrs.data.token})
     const price = response.data.price
     const new_amount = balance.amount + stock.quantity*price
     if (new_amount < 0) {
       console.log('Did not have enough money to make transaction')
       await job.remove();
       return;
     }
     var response = await Balance.updateOne({
       user_id: stock.user_id
     }, {
       amount: new_amount
     })
   }
   catch (e) {
     console.error(e)
     job.fail(e)
     return;
   }

   console.log(old_stock)
   const quantity = old_stock ? old_stock.quantity - stock.quantity : stock.quantity
   try {
     var result;
     if (quantity === 0) {
       result = await Stock.deleteOne({
         user_id: stock.user_id,
         stock_indicator: stock.stock_indicator
       });
     }
     else {
       result = await Stock.updateOne({
         user_id: stock.user_id,
         stock_indicator: stock.stock_indicator
       }, {
         quantity: quantity
       });
     }

     console.log(result);
   }
   catch(e) {
     console.error('could not update stock', e)
     job.fail(e)
     return;
   }

 });

 agenda.on('ready', async () => {
   try {
     await mongoose.connect(mongodb_url, {
         useNewUrlParser: true,
         useCreateIndex: true,
         useFindAndModify: false,
         useUnifiedTopology: true
     })
   }
   catch(e) {
     console.error("could not connect to mongodb", mongodb_url,e)
     process.exit(1)
   }
 })

 module.exports = agenda
