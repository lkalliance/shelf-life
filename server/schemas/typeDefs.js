const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Auth {
    token: ID
    user: User
  }

  type AuthReturn {
    token: ID
    user: User
    bookcase: Bookcase
  }

  type DeleteReturn {
    message: String
  }

  type User {
    _id: ID
    userName: String
    lookupName: String
    email: String
    password: String
    bookList: [Book]
  }

  type Bookcase {
    _id: ID
    user_id: ID
    userName: String
    lookupName: String
    year: String
    shelves: [Shelf]
    unshelved: [Book]
  }

  input BookcaseInput {
    fetched: Boolean
    user_id: ID
    year: String
    shelves: [ShelfInput]
    unshelved: [BookInput]
  }

  type Shelf {
    _id: ID
    left: [Book]
    right: [Book]
  }

  input ShelfInput {
    left: [BookInput]
    right: [BookInput]
  }

  type Book {
    _id: ID
    bookId: String!
    title: String!
    shortTitle: String
    audio: Boolean
    image: String
    description: String
    authors: [String]
    style: String
    height: String
    thickness: String
    text: String
    textSize: String
    color: String
    year: String
    rating: Int
    comment: String
  }

  input BookInput {
    bookId: String!
    title: String!
    shortTitle: String
    audio: Boolean
    image: String
    description: String
    authors: [String]
    style: String
    height: String
    thickness: String
    text: String
    textSize: String
    color: String
    year: String
    rating: Int
    comment: String
  }

  type Query {
    me(fetchMe: Boolean): User
    bookcase(year: String!, fetchMe: Boolean): Bookcase
    userBookcase(year: String!, user: String!): Bookcase
  }

  type Mutation {
    addUser(userName: String!, email: String!, password: String!): Auth
    addBookcase(
      user_id: ID!
      year: String
      shelves: [ShelfInput]
      unshelved: [BookInput]
    ): Bookcase
    login(email: String!, password: String!, year: String!): AuthReturn
    addBook(
      title: String!
      shortTitle: String = ""
      audio: Boolean = false
      authors: [String]
      image: String
      description: String
      color: String = "white"
      text: String = "#000000"
      textSize: String
      height: String = "medium"
      thickness: String = "mid"
      style: String = "paperback"
      bookId: String!
      rating: Int = 0
      comment: String = ""
      year: String
    ): User
    removeBook(bookId: String!, year: String, audio: Boolean): User
    arrangeBookcase(bookcase: BookcaseInput!): Bookcase
  }
`;

module.exports = typeDefs;
