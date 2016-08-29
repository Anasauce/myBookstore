const databaseName = 'bookstore'
const connectionString = `postgres://${process.env.USER}@localhost:5432/${databaseName}`
const pgp = require('pg-promise')()
const db = pgp(connectionString)

//get single book 
const getBookById = bookId => db.one("SELECT * FROM books WHERE books.id=$1", [bookId])

//get all books
const getAllBooks = () => db.any("SELECT * FROM books")

//get genre by book_id
const getGenreByBookId = bookId => {
  const sql = `
    SELECT genres.*, book_genres.book_id
    FROM genres
    LEFT JOIN book_genres
    ON genres.id = book_genres.genre_id
    WHERE book_genres.book_id
    IN ($1:csv) 
  ` //what does csv mean?
  return db.any(sql, [bookId]) 
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

const getEverything = book => {
//  getAllBooks()
  return getAllBooks()
  .then {
    // map through book data
    // asign book_id to variable
    map(book => {
      const bookId = book.id 
    }) 
    // pipe that data into a promise
      // promise calls get genre by book_id
      // and get author by book_id
    // pipe in 
  }

}

// const getEverythingByBookId = bookId => {
//   console.log('begining of everything by book id', bookId)
//   return Promise.all([
//     getAllBooks(),
//     getGenreByBookId(bookId),
//     getAuthorByBookId(bookId),
//     ]).then(data => {
//       console.log('I love data', data)
//       let book = data[0]
//       book.authors = data[2]
//       book.genres = data[1]
//       return book
//     })
// }


module.exports = { 
  getSingleBook,
  // getEverything: getEverything
}