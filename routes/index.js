var express = require('express');
var router = express.Router();
var queryLogic = require('../queryLogic')
var Search = require('../database/search').Search

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
    const size = 10
    console.log(page)
    Search.forBooks({ page, size, search_query: query.search_query })
      .then( books => {
        const ids = books.map( b => b.id )

        return Promise.all([
          Promise.resolve( books ),
          queryLogic.bookGenres( ids ),
          queryLogic.bookAuthors( ids )
        ])
      })
      .then( result => {
        const[ books, genres, authors ] = result
        console.log( books, genres, authors )

        const mergedBooks = books.map( book => {
          const bookAuthors = authors.filter( author => author.book_id === book.id )
          const bookGenres = genres.filter( genre => genre.book_id === book.id )

          return Object.assign( {}, book, { authors: bookAuthors, genres: bookGenres  })
        })

        response.render( 'index', { books: mergedBooks, page, size } )
      })
      .catch( error => response.send({ error, message: error.message }))
  }
})

router.get('/json', (request, response) => {
  queryLogic.getEverything( 1 )
  .then( result => response.json(result) )
  .catch( error => response.send({ error, message: error.message }))
})

module.exports = router;


 
  
 