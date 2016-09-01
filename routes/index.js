var express = require('express');
var router = express.Router();
var queryLogic = require('../queryLogic')
var Search = require('../database/search')

router.get('/', (request, response) => {
  const page = parseInt( request.query.page ) || 1
  const { query } = request

  if( query.search_query === undefined ) {
    queryLogic.getEverything( page )
      .then( data => {
        const { books, count } = data
        const pages = count / 10
        response.render('index', { books, count, page, pages })
      })
      .catch( error => response.send({ error, message: error.message }))
    } else {
      console.log(page)
      Search.forBooks({ page, size, search_query: query.search_query })
        .then( books => response.render( 'index', { books, page, size } ))
        .catch( error => response.send({ error, message: error.message }))
  }
})

router.get('/json', (request, response) => {
  queryLogic.getEverything( 1 )
  .then( result => response.json(result) )
  .catch( error => response.send({ error, message: error.message }))
})

module.exports = router;


 
  
 