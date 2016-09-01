const databaseName = 'bookstore'
const connectionString = `postgres://${process.env.USER}@localhost:5432/${databaseName}`
const pgp = require('pg-promise')()
const db = pgp(connectionString)

var bcrypt = require('bcrypt')
const saltRounds = 10

//get single book
const getBookById = bookId => db.one("SELECT * FROM books WHERE books.id=$1", [bookId])

const getAllGenres = () => db.any('SELECT * FROM genres')
const getAllAuthors = () => db.any('SELECT * FROM authors')

const getAllAuthorsAndGenres = () => {
  return Promise.all([
    getAllAuthors(),
    getAllGenres(),
  ])
    .then(choices => {
      return Object.assign(
      { authors: choices[0] },
      { genres: choices[1] }
      )
  })
}

//get all books
const getAllBooks = () => db.any('SELECT * FROM books')

//get genre by book_id
const getGenreByBookId = bookId => {
  const sql = `
    SELECT genres.*, book_genres.book_id
    FROM genres
    LEFT JOIN book_genres
    ON genres.id = book_genres.genre_id
    WHERE book_genres.book_id=$1
  `
  return db.any(sql, [bookId])
}

const getSingleBookDetails = bookId => {
  //stuff
}

const getAllTheThings = () => {
  const sql = `
    select books.*, authors.id as author_id, authors.name, genres.id as genre_id, genres.title as genre_title from books
    join book_authors on book_authors.book_id=books.id
    join authors on book_authors.author_id=authors.id
    join book_genres on book_genres.book_id=books.id
    join genres on book_genres.genre_id=genres.id
    order by books.id`

  return db.any( sql )
}

//get author by book_id
const getAuthorByBookId = bookId => {
  const sql = `
    SELECT authors.*, book_authors.book_id
    FROM authors
    LEFT JOIN book_authors
    ON authors.id = book_authors.author_id
    WHERE book_authors.book_id=$1
  `
  return db.any(sql, [bookId])
}

const getSingleBook = bookId => {
  return Promise.all([
    getBookById(bookId),
    getGenreByBookId(bookId),
    getAuthorByBookId(bookId),
  ]).then(data => {
    console.log(data[0] instanceof Array)
    return Object.assign(
      data[0],
      { authors: data[2] },
      { genres: data[1] }
    )
  })
}

const authors = (current=[], id, name) => {
  const index = current.find( item => item.id === id )

  if( index === undefined ) {
    return current.concat({ id, name })
  }

  return current
}

const genres = (current=[], id, title) => {
  const index = current.find( item => item.id === id )

  if( index === undefined ) {
    return current.concat({ id, title })
  }

  return current
}



const getEverything = book => {
  return Promise.all([
    getAllTheThings()
  ]).then( results => {
    const reducer = (memo, row) => {
      let index = memo.findIndex( element => element.id === row.id )

      if( index === -1 ) {
        memo.push( row )
        index = memo.length - 1
      }

      const book = memo[ index ]

      memo[ index ] = Object.assign( 
        {},
        { id: book.id, title: book.title, description: book.description, img_url: book.img_url },
        { authors: authors( book.authors, row.author_id, row.name ) },
        { genres: genres( book.genres, row.genre_id, row.genre_title )}
      )

      return memo
    }

    return results[ 0 ].reduce( reducer, [] )
  })
}

//Admin user can enter new books into the database

const createBookSql = `
  INSERT INTO 
    book (title, description, img_url)
  VALUES 
    ($1, $2, $3) 
  RETURNING
    *
`
// const createBook = book => {
//   return generateBookEntry( book )
//     .then( addAuthorsAndGenres )
//     .then( respondWithBookId )
// }

const createAuthor = name => {
  const sql = `
    INSERT INTO
      author (name)
    VALUES
      ($1)
    RETURNING 
      *
  `
  return db.one(sql, [name])
}

const createBook = function(book){
  const sql = `
    INSERT INTO
      books (title, description, img_url)
    VALUES
      ($1, $2, $3)
    RETURNING
      id
  `
  var queries = [
    db.one(sql, [
      book.title,
      book.description,
      book.img_url
    ])
  ]

  return Promise.all(queries)
    .then(results => {
      const [ newBook ] = results

      console.log(newBook)

      return Promise.all([
        joinAuthorsWithBook(book.authors, newBook.id),
        joinGenresWithBook(book.genres, newBook.id)
      ]).then(function(){
        return newBook.id;
      })
    })
}

// const generateBookEntry = book =>
//   console.log(book)

//   Promise.all([
//     db.one( createBookSql, [ book.title, book.description, book.img_url ]),
//   ])
//   .then(book => {
//     // new Promise( (resolve, reject) => resolve( book.genres ))
//     console.log('its oook', book);


//     // book.authors.filter( author => author.length > 0 )
//     //   .map( author => createAuthor( author ) )
//   })

const addAuthorsAndGenres = results => {
  
  const bookResult = results[ 0 ]
  const bookId = parseInt( bookResult.id )

  const genres = results[ 1 ]

  const authors = results.slice( 2 )
  const authorIds = authors.map( author => author.id )

  return Promise.all([
    joinAuthorsWithBook( authorIds, bookId ),
    joinGenresWithBook( genres, bookId ),
    new Promise( (resolve, reject) => resolve( bookId ) )
  ])
}  

const respondWithBookId = results => results[ 2 ]

const joinAuthorBookSql = `
  INSERT INTO 
    book_authors(book_id, author_id) 
  VALUES 
    ($1, $2) 
  RETURNING 
    *
`
const joinAuthorsWithBook = (authorIds, bookId) => {
  console.log('its', authorIds, bookId)
  db.one( joinAuthorBookSql, [ bookId, authorIds ])
  
}

const joinGenreBookSql = `
  INSERT INTO 
    book_genres(book_id, genre_id) 
  VALUES 
    ($1, $2) 
  RETURNING 
    *
`
const joinGenresWithBook = (genreIds, bookId) => {
  db.one( joinGenreBookSql, [ bookId, genreIds ])
}

//User can create an admin account
//Auth is used for login

const createSalt = password => {
  return new Promise( (resolve, reject) => {
    bcrypt.genSalt( saltRounds, (error, salt) => {
      if( error ) {
        reject( error )
      }

      resolve([ salt, password ])
    })
  })
}

const hashPassword = saltResult => {
  const [ salt, password ] = saltResult

  return new Promise( (resolve, reject) => {
      bcrypt.hash( password, salt, (error, hash) => {
        if( error ) {
          reject( error )
        }

        resolve( hash )
      })
  })
}

const comparePassword = (password, user) => {
  return new Promise( (resolve, reject) => {
    bcrypt.compare( password, user.password, (err, result) => {
      const data = result ? user : null

      resolve( data )
    })
  })
}

const User = {
  find: (email, password) => {
    return db.oneOrNone( 'SELECT * FROM users WHERE email=$1', [email] )
      .then( user => comparePassword( password, user ))
  },
  findById: id => db.one( 'SELECT * FROM users WHERE id=$1', [id] ),
  createOne: (email, password) => {
    return createSalt( password )
      .then( hashPassword )
      .then( hash => {
        return db.one(
          'INSERT INTO users(email, password) VALUES ($1, $2) RETURNING *',
          [email, hash]
        )
      })
  }
}

module.exports = {
  getSingleBook,
  User,
  getEverything,
  createBook, 
  createAuthor, 
  joinGenresWithBook, 
  joinAuthorsWithBook,
  getAllAuthors,
  getAllGenres,
  getAllAuthorsAndGenres,
  getSingleBookDetails
}