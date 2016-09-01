var express = require('express');
var router = express.Router();
var queryLogic = require('../queryLogic')

router.get('/', (request, response) => {
  const page = parseInt( request.query.page ) || 1

  queryLogic.getEverything( page )
    .then( data => {
      const { books, count } = data
      const pages = count / 10

      response.render('index', { books, count, page, pages })
    })
    .catch( error => response.send({ error, message: error.message }))
})

router.get('/json', (request, response) => {
  queryLogic.getEverything( 1 )
  .then( result => response.json(result) )
  .catch( error => response.send({ error, message: error.message }))
})

module.exports = router;
