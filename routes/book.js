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

router.get( '/:id/edit', (request, response) => {
  queryLogic.getSingleBook( request.params.id )
    .then( book => response.render( 'editBook', { book } ))
    .catch( error => response.send({ message: error.message }))
})

router.post( '/:id/update', (request, response) => {
  const { id } = request.params
  const { title, description, image_url } = request.body

  queryLogic.updateBook( id, title, description, img_url )
    .then( result => response.redirect( `/book/${id}` ) )
    .catch( error => response.send({ message: error.message }))
})


module.exports = router;
