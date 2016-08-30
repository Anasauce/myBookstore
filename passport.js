const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const User = require('./queryLogic').User

const findUser = ( email, password ) => {
  return User.find( email, password )
}

const strategy = new LocalStrategy( (email, password, done ) => {
  findUser( email, password )
    .then( user => {
      if( user === null ) {
        done( null, false, { message: 'Incorrect email or password.' })
      } else {
        done( null, user )
      }
    })
    .catch( error => done( err ) )
})

passport.use( strategy )