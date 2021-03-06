/**
 * @Author: Mathew Black <Mathew>
 * @Date:   2019-11-02T12:48:40-05:00
 * @Email:  dev@mathewblack.com
 * @Filename: user.js
 * @Last modified by:   Mathew
 * @Last modified time: 2019-12-04T15:45:44-06:00
 * @License: MIT
 */

 const base_exchange_url =  process.env.EXCHANGE_URL || "http://localhost:4000/stock_api"
 const client = process.env.CLIENT || "localhost"
 const port = process.env.PORT || 5000
 const base_route = process.env.BASE_ROUTE || "/api"

const routes = require('express').Router();
const axios = require('axios');
const mongoose = require('mongoose')

const Account = require('../models/Account-model')
const Stock = require('../models/Stock-model')
const Schedule = require('../models/Schedule-model')
const Balance = require('../models/Balance-model')
const Users = require('../models/Users-model')
const agenda = require('../jobs/jobs')

routes.route('/stocks')
.get(async (req, res) => {
  try {
    var stocks = await Stock.find({user_id: req.user._id})
    for (var i = 0; i < stocks.length; i++) {
      var stock = stocks[i]
      var today = new Date().toISOString()
      var last_month =  new Date()
      last_month.setMonth(last_month.getMonth() - 1)
      last_month = last_month.toISOString()
      var response = await axios.post(`${base_exchange_url}/stocks/daily/${stock.stock_indicator}`, {
        start_datetime: last_month,
        end_datetime: today,
        token: req.token
      })
      stocks[i] = {
        ...response.data,
        ...stock.toObject()
      }
    }
    res.json(stocks)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})
.put(async (req, res) => {
  const newStock = req.body
  var stock = {
    ...newStock,
    user_id: req.user_id
  }
  if (stock.type === "buy") {
    delete stock.type
    agenda.now('buyStock', {stock, token: req.token})
  }
  else if (stock.type === "sell") {
    delete stock.type
    agenda.now('sellStock', {stock, token: req.token})
  }
  res.json(stock)
})
.post(async (req, res) => {
  const newStocks = req.body
  var payload = []
  if (!(newStocks instanceof Array)) {
    res.status(400).send('request is not a list of stocks!')
    return
  }
  try {
    for (var i = 0; i < newStocks.length; i++) {
      var stock = {
        ...newStocks[i],
        user_id: req.user._id
      }
      payload.push(stock)
      if (stock.type === "buy") {
        delete stock.type
        agenda.now('buyStock', {stock, token: req.token})
      }
      else if (stock.type === "sell") {
        delete stock.type
        agenda.now('sellStock', {stock, token: req.token})
      }
    }
    res.json(payload)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)

  }

})

routes.route('/stocks/:stock_id')
.get(async (req, res) => {
  var stock_id = req.params.stock_id
  try {
    var stock = await Stock.findOne({user_id: req.user._id, stock_indicator: stock_id})
    var today = new Date().toISOString()
    var last_month =  new Date()
    last_month.setMonth(last_month.getMonth() - 1)
    last_month = last_month.toISOString()
    var response = await axios.post(`${base_exchange_url}/stocks/daily/${stock_id}`, {
      start_datetime: last_month,
      end_datetime: today,
      token: req.token
    })
    stock = {
      ...stock.toObject(),
      ...response.data,
    }
    res.json(stock)
  }
  catch (e) {
    console.error(e)
res.status(400).send(e)
  }
})
.delete(async (req,res) => {
  try {
    var result = await Stock.deleteOne({
      user_id: req.user._id,
      stock_indicator: req.params.stock_id
    })
    res.send(result)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }

})

routes.route('/profile')
.get(async (req, res) => {
  try {
      const user = await Users.findOne({_id: req.user._id})
      res.json(user)
  }
  catch (e) {
      console.error(e)
      res.status(400).send(e)
  }
})
.put(async (req,res) => {
  try {
      const result = await Users.updateOne({
        _id: req.user._id
      }, req.body)
      res.json(result)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})

routes.route('/accounts')
.get(async (req,res) => {
  try {
    const Accounts = await Account.find({user_id: req.user._id})
    res.json(Accounts)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})
.post(async (req,res) => {
  const newAccount = {
    ...req.body,
    user_id: req.user._id
  }
  try {
      const account = await Account(newAccount)
      await account.save()
      res.json(account)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})

routes.route('/accounts/:account_id')
.get(async (req, res) => {
  try {
      const account = await Account.find({
        _id: req.params.account_id,
        user_id: req.user._id
      })
      res.json(account.toObject())
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})
.put(async (req,res) => {
  try {
      const result = await Account.findOneAndUpdate({
        _id: req.params.account_id,
        user_id: req.user._id
      }, req.body)
      res.json(account)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})
.delete(async (req,res) => {
  try {
      const result = await Account.findOneAndDelete({
          _id: req.params.account_id,
          user_id: req.user._id
      })
      res.send(result)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})


routes.route('/schedules')
.get(async (req,res) => {
  try {
    const Schedules = await Schedule.find({user_id: req.user._id})
    res.json(Schedules)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})
.post(async (req,res) => {
  const newSchedule = {
    ...req.body,
    user_id: req.user._id
  }
  var job;
  try {
    const stock = {
      user_id: req.user._id,
      stock_indicator: newSchedule.stock_indicator,
      quantity: newSchedule.quantity
    }
    if (newSchedule.type === "buy") {
      job = agenda.create('buyStock',{stock, token: req.token, end_datetime: new Date(newSchedule.end_datetime)})
      job.schedule(new Date(newSchedule.start_datetime))
      .repeatEvery(`${newSchedule.interval} ${newSchedule.frequency}`)
      await job.save()
    }
    else if (newSchedule.type === "sell") {
      job = agenda.create('sellStock',{stock, token: req.token, end_datetime: new Date(newSchedule.end_datetime)})
      job.schedule(new Date(newSchedule.start_datetime))
      .repeatEvery(`${newSchedule.interval} ${newSchedule.frequency}`)
      await job.save()
    }
    else {
      res.status(400).send(`Schedule type of ${type} doesn't make sense`)
    }
    console.log(job)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
  try {
      const schedule = await Schedule({
        ...newSchedule,
        job_id: job.attrs._id
      })
      await schedule.save()

      res.json({ schedule })
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})

routes.route('/schedules/:schedule_id')
.get(async (req, res) => {
  try {
      const schedule = await Schedule.find({
        _id: req.params.schedule_id,
        user_id: req.user._id
      })
      res.json(schedule.toObject())
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})
.put(async (req,res) => {
  const newSchedule = req.body
  try {
      const schedule = await Schedule.findOne({
          _id: req.params.schedule_id,
          user_id: req.user._id
      })

      var job = await agenda.jobs({_id: schedule.job_id});
      job = job[0]
      if (job && await job.remove()) {
        console.log("Deleted Job from agenda")
      }

      const stock = {
        user_id: req.user._id,
        stock_indicator: newSchedule.stock_indicator,
        quantity: newSchedule.quantity
      }
      if (newSchedule.type === "buy") {
        job = agenda.create('buyStock',{stock, token: req.token, end_datetime: new Date(newSchedule.end_datetime)})
        job.schedule(new Date(newSchedule.start_datetime))
        .repeatEvery(`${newSchedule.interval} ${newSchedule.frequency}`)
        await job.save()
      }
      else if (newSchedule.type === "sell") {
        job = agenda.create('sellStock',{stock, token: req.token, end_datetime: new Date(newSchedule.end_datetime)})
        job.schedule(new Date(newSchedule.start_datetime))
        .repeatEvery(`${newSchedule.interval} ${newSchedule.frequency}`)
        await job.save()
      }
      else {
        res.status(400).send(`Schedule type of ${type} doesn't make sense`)
      }

      const result = await Schedule.updateOne({
        _id: req.params.schedule_id,
        user_id: req.user._id
      }, {
        ...req.body,
        job_id: job.attrs._id
      })

      res.json(result)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})
.delete(async (req,res) => {
  try {
      const schedule = await Schedule.findOne({
          _id: req.params.schedule_id,
          user_id: req.user._id
      })
      console.log(schedule)

      var job = await agenda.jobs({_id: schedule.job_id});
      job = job[0]
      if (job && await job.remove()) {
        console.log("Deleted Job from agenda")
      }

      const result = await Schedule.deleteOne({
          _id: req.params.schedule_id,
          user_id: req.user._id
      })
      res.send(result)
  }
  catch (e) {
      console.error(e)
res.status(400).send(e)
  }
})

routes.get('/balance', async (req,res) => {
  try {
    var balance = await Balance.findOne({user_id: req.user._id})
    res.json(balance)
  }
  catch (e) {
    console.error(e)
res.status(400).send(e)
  }
})

routes.post('/transfer', async (req,res) => {
  const {from_id, to_id, amount} = req.body;
  try {
    const old_balance = await Balance.findOne({user_id: req.user._id})
    var transfered_amount = old_balance.amount
    console.log(transfered_amount, typeof transfered_amount)
    if (from_id === "balance") {
      // transfer out
      transfered_amount -= parseFloat(amount)
    }
    else if (to_id === "balance") {
      // transfer in
      transfered_amount += parseFloat(amount)
    }
    else {
      res.status(400).send('cannot transfer between accounts, only to and from the balance')
    }
    const balance = await Balance.findOneAndUpdate({user_id: req.user._id}, {
      amount: transfered_amount
    })
    res.json({...balance, new_amount: transfered_amount})
  }
  catch (e) {
    console.error(e)
    console.error(e)
res.status(400).send(e)
  }
})
module.exports = routes;
