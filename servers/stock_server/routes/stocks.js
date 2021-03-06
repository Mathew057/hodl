/**
 * @Author: Mathew Black <Mathew>
 * @Date:   2019-11-02T12:53:11-05:00
 * @Email:  dev@mathewblack.com
 * @Filename: stocks.js
 * @Last modified by:   Mathew
 * @Last modified time: 2019-12-04T15:47:05-06:00
 * @License: MIT
 */

 const routes = require('express').Router();
 const {
   Stocks_Weekly,
   Stocks_Daily,
   Stocks_Hourly,
   Stocks_5min
 } = require('../models/Stock-model')

 function precDiff(a, b) {
  return  100 * ( a - b ) / ( (a+b)/2 );
 }

 routes.route('/')
 .post(async (req,res) => {
   var last_month =  new Date()
   last_month.setMonth(last_month.getMonth() - 1);
   try {
   var stocks = await Stocks_Hourly.aggregate([
     {
       $match: {
         datetime: {
           $gte: last_month
         }
       }
     },
     {
      $sort: {
          datetime: 1
      }
  }, {
      $group: {
          _id: "$stock_indicator",
          stock_indicator: {
              "$first": "$stock_indicator"
          },
          company_name: {
              "$first": "$company_name"
          },
          graph: {
              "$push": {
                  t: "$datetime",
                  y: "$price"
              }
          }
      }
  }])

   payload = []

   for (var i = 0; i < stocks.length; i++) {
     payload.push({
       ...stocks[i],
       price: stocks[i].graph[stocks[i].graph.length-1].y,
       trend: stocks[i].graph.length > 1 ? precDiff(stocks[i].graph[stocks[i].graph.length-1].y, stocks[i].graph[stocks[i].graph.length-2].y): 0
     })
   }
   res.json(payload)
 }
 catch (e) {
   console.error(e)
     res.status(400).send(e)
 }
 })

 routes.post("/latest",async (req, res) => {
   try {
   var stocks = await Stocks_5min.aggregate([
     {
      $sort: {
          datetime: -1
      }
    },
    {
        $group: {
            _id: "$stock_indicator",
            stock_indicator: {
                "$first": "$stock_indicator"
            },
            company_name: {
                "$first": "$company_name"
            },
            quantity: {
                "$first": "$quantity"
            },
            datetime: {
                "$first": "$datetime"
            },
            price: {
                "$first": "$price"
            }
        }
    }
  ])
  if (stocks) {
    res.json(stocks)
  }
  else {
    res.send('No Results')
  }
}
catch (e) {
  console.error(e)
    res.status(400).send(e)
}
 })

 routes.post("/latest/:stock_id",async (req,res) => {
   const stock_id = req.params.stock_id
   try {
   var stock = await Stocks_5min.aggregate([
     {
       $match: {
         stock_indicator: stock_id
       }
     },
     {
      $sort: {
          datetime: -1
      }
    },
    {
        $group: {
            _id: "$stock_indicator",
            stock_indicator: {
                "$first": "$stock_indicator"
            },
            company_name: {
                "$first": "$company_name"
            },
            quantity: {
                "$first": "$quantity"
            },
            price: {
                "$first": "$price"
            }
        }
    }
  ])
  stock = stock[0]
  if (stock) {
    res.json(stock)
  }
  else {
    res.send('No Results')
  }
}
catch (e) {
  console.error(e)
    res.status(400).send(e)
}
 })

 routes.route("/5min/:stock_id")
 .post(async (req,res) => {
   var {start_datetime, end_datetime} = req.body
   start_datetime = new Date(start_datetime)
   end_datetime = new Date(end_datetime)
   const stock_id = req.params.stock_id
   try {
   var stock = await Stocks_5min.aggregate([
     {
       $match: {
         datetime: {
           $gte: start_datetime,
           $lte: end_datetime
         },
         stock_indicator: stock_id
       }
     },
     {
      $sort: {
          datetime: 1
      }
  }, {
      $group: {
          _id: "$stock_indicator",
          stock_indicator: {
              "$first": "$stock_indicator"
          },
          company_name: {
              "$first": "$company_name"
          },
          graph: {
              "$push": {
                  t: "$datetime",
                  y: "$price"
              }
          }
      }
  }])

  stock = stock[0]


  if (stock) {
    res.json({
      ...stock,
      price: stock.graph[stock.graph.length-1].y,
      trend: stock.graph.length > 1 ? precDiff(stock.graph[stock.graph.length-1].y, stock.graph[stock.graph.length-2].y): 0
    })
  }
  else {
    res.send('No Results')
  } }
  catch (e) {
    console.error(e)
      res.status(400).send(e)
  }

 })

 routes.route("/hourly/:stock_id")
 .post(async (req,res) => {
   var {start_datetime, end_datetime} = req.body
   start_datetime = new Date(start_datetime)
   end_datetime = new Date(end_datetime)
   const stock_id = req.params.stock_id
   try {
   var stock = await Stocks_Hourly.aggregate([
     {
       $match: {
         datetime: {
           $gte: start_datetime,
           $lte: end_datetime
         },
         stock_indicator: stock_id
       }
     },
     {
      $sort: {
          datetime: 1
      }
  }, {
      $group: {
          _id: "$stock_indicator",
          stock_indicator: {
              "$first": "$stock_indicator"
          },
          company_name: {
              "$first": "$company_name"
          },
          graph: {
              "$push": {
                  t: "$datetime",
                  y: "$price"
              }
          }
      }
  }])
stock = stock[0]
if (stock) {
  res.json({
    ...stock,
    price: stock.graph[stock.graph.length-1].y,
    trend: stock.graph.length > 1 ? precDiff(stock.graph[stock.graph.length-1].y, stock.graph[stock.graph.length-2].y): 0
  })
}
else {
  res.send('No Results')
} }
catch (e) {
  console.error(e)
    res.status(400).send(e)
}
 })

 routes.route("/daily/:stock_id")
 .post(async (req,res) => {
   var {start_datetime, end_datetime} = req.body
   start_datetime = new Date(start_datetime)
   end_datetime = new Date(end_datetime)
   const stock_id = req.params.stock_id
   try {
   var stock = await Stocks_Daily.aggregate([
     {
       $match: {
         datetime: {
           $gte: start_datetime,
           $lte: end_datetime
         },
         stock_indicator: stock_id
       }
     },
     {
      $sort: {
          datetime: 1
      }
  }, {
      $group: {
          _id: "$stock_indicator",
          stock_indicator: {
              "$first": "$stock_indicator"
          },
          company_name: {
              "$first": "$company_name"
          },
          graph: {
              "$push": {
                  t: "$datetime",
                  y: "$price"
              }
          }
      }
  }])
stock = stock[0]
console.log(stock)
  if (stock) {
    res.json({
      ...stock,
      price: stock.graph[stock.graph.length-1].y,
      trend: stock.graph.length > 1 ? precDiff(stock.graph[stock.graph.length-1].y, stock.graph[stock.graph.length-2].y): 0
    })
  }
  else {
    res.send('No Results')
  }
}
catch (e) {
  console.error(e)
    res.status(400).send(e)
}
 })

 routes.route("/weekly/:stock_id")
 .post(async (req,res) => {
   var {start_datetime, end_datetime} = req.body
   start_datetime = new Date(start_datetime)
   end_datetime = new Date(end_datetime)
   const stock_id = req.params.stock_id
   try {
   var stock = await Stocks_Weekly.aggregate([
     {
       $match: {
         datetime: {
           $gte: start_datetime,
           $lte: end_datetime
         },
         stock_indicator: stock_id
       }
     },
     {
      $sort: {
          datetime: 1
      }
  }, {
      $group: {
          _id: "$stock_indicator",
          stock_indicator: {
              "$first": "$stock_indicator"
          },
          company_name: {
              "$first": "$company_name"
          },
          graph: {
              "$push": {
                  t: "$datetime",
                  y: "$price"
              }
          }
      }
  }])
stock = stock[0]
if (stock) {
  res.json({
    ...stock,
    price: stock.graph[stock.graph.length-1].y,
    trend: stock.graph.length > 1 ? precDiff(stock.graph[stock.graph.length-1].y, stock.graph[stock.graph.length-2].y): 0
  })
}
else {
  res.send('No Results')
}
}
catch (e) {
  console.error(e)
    res.status(400).send(e)
}
 })

 module.exports = routes;
