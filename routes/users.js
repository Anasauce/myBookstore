var express = require('express');
var router = express.Router();

const passport = require( '../passport' )
const authOptions = {
  successRedirect: '/',
  failureRedirect: '/users/login'
}

router.get( '/login', (request, response) => {
  response.render( 'auth/login' )
})

router.post( '/login', passport.authenticate( 'local', authOptions ))

router.get( '/signup', (request, response) => {
  response.render( 'auth/signup' )
})

router.get( '/logout', (request, response) => {
  request.logout()
  response.redirect( '/' )
})

module.exports = router;
