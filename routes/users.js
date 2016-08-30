const express = require('express');
const router = express.Router();

const passport = require( '../passport' )
const authOptions = {
  successRedirect: '/',
  failureRedirect: '/users/login'
}

const User = require( '../queryLogic' ).User

router.get( '/login', (request, response) => {
  response.render( 'auth/login' )
})

router.post( '/login', passport.authenticate( 'local', authOptions ))

router.get( '/signup', (request, response) => {
  response.render( 'auth/signup' )
})

router.post( '/signup', (request, response, next) => {
  const { email, password } = request.body

  User.createOne( email, password )
    .then( user => {
      request.login({ id: user.id, email }, error => {
        if( error ) {
          next( error )
        }

        response.redirect( '/' )
      })
    })
    .catch( error => {
      response.render( 'auth/signup', { message: 'That email address is not available.' })
    })
})

router.get( '/logout', (request, response) => {
  request.logout()
  response.redirect( '/' )
})

module.exports = router;
