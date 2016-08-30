var express = require('express');
var router = express.Router();
// var queryLogic = require('../queryLogic')

router.get('/', (request, response) => {
  response.send( { data: 'hi' })
  // queryLogic.getEverything()
  // .then( data => res.json(data) )
  // .catch( error => response.send({ error, message: error.message }))
})

// router.get('/test', (req, res) => {
//   res.render('index')
//   .catch( error => response.send({ error, message: error.message }))
// })

module.exports = router;
