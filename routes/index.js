var express = require('express');
var router = express.Router();
var queryLogic = require('../queryLogic')

/* GET home page. */

router.get('/', (req, res) => {
  queryLogic.getEverything()
  .then(data => {
    res.json(data)
  })
  // res.render('index')
  .catch( error => response.send({ error, message: error.message }))
})

// router.get('/test', (req, res) => {
//   res.render('index')
//   .catch( error => response.send({ error, message: error.message }))
// })

module.exports = router;
