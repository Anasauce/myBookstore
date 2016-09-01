var express = require('express');
var router = express.Router();
var queryLogic = require('../queryLogic')

//display add new book view 
//create
//todo write logic to add to db
router.get( '/new', (request, response) => {
  queryLogic.getAllAuthorsAndGenres()
  .then( choices => response.render('new', {choices: choices}))
})

router.post( '/new', (request, response, next) => {
  console.log('Whats Bok', request.body)

  queryLogic.createBook( request.body )
    .then( bookId => response.redirect( `/`) )
    .catch( error => response.send({ error, message: error.message }) )
})

router.get( '/json', (request, response) => {
  queryLogic.getAllAuthorsAndGenres()
  .then( choices => response.json(choices))
})

// router.get( '/:id', (request, response) => {
//   // queryLogic.getSingleBookDetails()
//   response.render('bookDetail')
// })



//edit book in db
//todo write logic to edit book


//delete book from db
//todo write logic to delete book

module.exports = router;
