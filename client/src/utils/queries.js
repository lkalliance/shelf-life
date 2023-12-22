import { gql } from "@apollo/client";

export const QUERY_ME = gql`
  query Me($fetchMe: Boolean) {
    me(fetchMe: $fetchMe) {
      _id
      userName
      bookList {
        bookId
        title
        audio
        authors
        image
        description
        rating
        comment
        year
        color
        text
        height
        thickness
        style
      }
    }
  }
`;

export const QUERY_BOOKCASE = gql`
  query Bookcase($year: String!, $fetchMe: Boolean) {
    bookcase(year: $year, fetchMe: $fetchMe) {
      shelves {
        left {
          authors
          bookId
          color
          text
          comment
          image
          description
          height
          rating
          style
          thickness
          title
          shortTitle
          year
        }
        right {
          authors
          bookId
          color
          text
          comment
          image
          description
          height
          rating
          style
          thickness
          title
          shortTitle
          year
        }
      }
      unshelved {
        authors
        bookId
        color
        text
        comment
        image
        description
        height
        rating
        style
        thickness
        title
        shortTitle
        year
      }
      user_id
      year
    }
  }
`;
