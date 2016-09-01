const databaseName = 'bookstore'
const connectionString = `postgres://${process.env.USER}@localhost:5432/${databaseName}`
const pgp = require('pg-promise')()
const db = pgp(connectionString)

const Search = {
  forBooks: options => {
    const variables = []
    let sql = `SELECT DISTINCT(books.*) FROM books`

    if (options.search_query){
      let search_query = options.search_query
        .toLowerCase()
        .replace(/^ */, '%')
        .replace(/ *$/, '%')
        .replace(/ +/g, '%')

      variables.push(search_query)
      sql += `
      LEFT JOIN book_authors ON books.id=book_authors.book_id
      LEFT JOIN authors ON authors.id=book_authors.author_id
      LEFT JOIN book_genres ON books.id=book_genres.book_id
      LEFT JOIN genres ON genres.id=book_genres.genre_id
      WHERE LOWER(books.title)  LIKE $${variables.length}
      OR LOWER(authors.name) LIKE $${variables.length}
      OR LOWER(genres.title) LIKE $${variables.length}
      ORDER BY books.id ASC
      `
    }

    if (options.page){
      let PAGE_SIZE = parseInt( options.size || 10 )
      let offset = (parseInt(options.page) - 1) * PAGE_SIZE
      variables.push(offset)
      sql += `
      LIMIT ${PAGE_SIZE}
      OFFSET $${variables.length}
      `
    }

    return db.any(sql, variables)
  }
}

module.exports = {
  Search
}