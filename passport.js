const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;

const findUser = ( username, password ) => {
  return {} // Pay no attention to the man behind the curtain
}

const strategy = new LocalStrategy( (username, password, done ) => {

  // Find the user referenced by username/password
    // if error returned, done(err)
    // if user not found, done( null, false, { message: 'Incorrect username or password.'})
    // if not valid password , done( null, false, { message: 'Incorrect password or password.'})
    // we found one: done( null, user )
})

passport.use( strategy )