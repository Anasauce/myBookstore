var express = require('express');
var router = express.Router();
var queryLogic = require('../queryLogic')

router.get( '/new', (request, response) => {
  queryLogic.getAllAuthorsAndGenres()
  .then( choices => response.render('new', {choices: choices}))
})

router.post( '/new', (request, response, next) => {
  queryLogic.createBook( request.body )
    .then( bookId => response.redirect( `/`) )
    .catch( error => response.send({ error, message: error.message }) )
})

router.get( '/json', (request, response) => {
  queryLogic.getAllAuthorsAndGenres()
  .then( choices => response.json(choices))
})

router.get( '/singleBookJson/:id', (request, response) => {
  const bookId = request.params.id
  queryLogic.getSingleBook(bookId)
  .then(singleBook => response.json(singleBook))
})

router.get( '/:id', (request, response) => {
  const bookId = request.params.id
  queryLogic.getSingleBook(bookId)
  .then(singleBook => response.render('bookDetail', {singleBook: singleBook}))
})

router.get('/:id/delete', (request, response) => {
  const bookId = request.params.id
  queryLogic.deleteBook(bookId)
    .then(() => response.redirect('/'))
    .catch( error => response.send({ error, message: error.message }) )
})


module.exports = router;
