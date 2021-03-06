/**
 * @Author: Mathew Black <Mathew>
 * @Date:   2019-11-02T12:52:18-05:00
 * @Email:  dev@mathewblack.com
 * @Filename: login.js
 * @Last modified by:   Mathew
 * @Last modified time: 2019-12-04T15:30:26-06:00
 * @License: MIT
 */
const routes = require('express').Router();
const Users = require('../models/Users-model')
const Balance = require('../models/Balance-model')
const auth = require('../middlewares/auth')

// User create (signup)
routes.post('/signup', async (req, res) => {
   const newUser = req.body
   const fieldsToAdd = Object.keys(newUser)
   const fieldsInModel = ['name', 'email', 'password', 'address', 'username']
   const isAdditionAllowed = fieldsToAdd.every((field) => fieldsInModel.includes(field))

   if (!isAdditionAllowed) {
       return res.status(400).send({ error: 'Invalid fields to Add!' })
   }

   try {
       const user = await Users(newUser)

       await user.save()

       const balance = await Balance({
         user_id: user._id,
         amount: 0
       })

       await balance.save()

       res.send({ user })
   }
   catch (e) {
     console.log(e)
       res.status(400).send(e)
   }
})

// check if previously loggeding
routes.post('/init', auth, async (req, res) => {
   try {
       const cookieOptions = {
           httpOnly: true,
       };

       const { token, user } = req
       if (token && user) {
           res.cookie('app-jt', req.token, cookieOptions).send({ user, token })
       }
   } catch (e) {
     console.log(e)
       res.status(400).send(e)
   }
})

// Login user
routes.post('/login', async (req, res) => {
   try {
       const cookieOptions = {
           httpOnly: true,
       };
       const {email,password} = req.body

       const user = await Users.findByCredentials(email, password)

       const token = await user.generateAuthToken()

       res.cookie('app-jt', token, cookieOptions).send({ user, token })

   } catch (e) {
      console.log(e)
       res.status(400).send(e)
   }
})

//logout user
routes.post('/logout', auth, async (req, res) => {
   try {
       const { user, token } = req

       user.tokens = user.tokens.filter((t) => t.token !== token)
       await user.save()

       res.clearCookie('app-jt')

       res.send()
   } catch (e) {
     console.log(e)
       res.status(400).send(e)
   }
})

module.exports = routes;
