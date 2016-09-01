const databaseName = 'bookstore'
const connectionString = `postgres://${process.env.USER}@localhost:5432/${databaseName}`
const pgp = require('pg-promise')()
const db = pgp(connectionString)

var bcrypt = require('bcrypt')
const saltRounds = 10

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

const getAllBooks = () => db.any('SELECT * FROM books')

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

const allBooks = offset =>
  db.any( 'SELECT * FROM books LIMIT 10 OFFSET $1', [ offset ] )

const bookCount = () =>
  db.one( 'SELECT COUNT(*) FROM books' )

const bookGenres = bookIds =>
  db.any( `
    SELECT * FROM genres
    JOIN book_genres ON book_genres.genre_id=genres.id
    WHERE book_genres.book_id IN ($1:csv)`,
    [ bookIds ]
  )

const bookAuthors = bookIds =>
  db.any( 'SELECT * FROM authors JOIN book_authors ON book_authors.author_id=authors.id WHERE book_authors.book_id IN ($1:csv)', [ bookIds ] )


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

const getEverything = page => {
  return allBooks( 10 * (page-1) )
    .then( books => {
      const ids = books.map( book => book.id )

      return Promise.all([
        bookCount(),
        bookGenres( ids ),
        bookAuthors( ids ),
        new Promise( (resolve, reject) => resolve( books ))
      ])
    })
    .then( result => {
      const [ count, genres, authors, books ] = result

      const mergedBooks = books.map( book => {
        const bookAuthors = authors.filter( author => author.book_id === book.id )
        const bookGenres = genres.filter( genre => genre.book_id === book.id )

        return Object.assign( {}, book, { authors: bookAuthors, genres: bookGenres  })
      })

      return new Promise( (resolve, reject) => resolve({ books: mergedBooks, count: count.count }))
    })
}

//Admin user can enter new books into the database

const createBookSql = `
  INSERT INTO book (title, description, img_url)
  VALUES ($1, $2, $3) RETURNING *`

const createAuthor = name => {
  const sql = `INSERT INTO author ( name ) VALUES ( $1 ) RETURNING *`

  return db.one(sql, [name])
}

const createBook = function(book){
  const sql = `
    INSERT INTO books( title, description, img_url )
    VALUES ( $1, $2, $3 )
    RETURNING id`

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
  INSERT INTO book_authors(book_id, author_id)
  VALUES ($1, $2)
  RETURNING *`

const joinAuthorsWithBook = (authorIds, bookId) => {
  db.one( joinAuthorBookSql, [ bookId, authorIds ])
}

const joinGenreBookSql = `
  INSERT INTO book_genres(book_id, genre_id)
  VALUES ($1, $2) RETURNING *`

const joinGenresWithBook = (genreIds, bookId) => {
  db.one( joinGenreBookSql, [ bookId, genreIds ])
}

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
  getAllAuthorsAndGenres
}