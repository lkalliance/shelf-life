// This component creates a book for the bookcase

import "./Book.css";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { cloneDeep } from "lodash";
import { ARRANGE_BOOKCASE, REMOVE_BOOK } from "../../utils/mutations";
import { QUERY_ME, QUERY_BOOKCASE } from "../../utils/queries";
import { Draggable } from "@hello-pangea/dnd";
import { ViewModal } from "../ViewModal";
import {
  isTight,
  titleSmooshing,
  convert,
  calcTilt,
} from "../../utils/dragUtils";

function Book({
  uCase,
  uBooks,
  uSetCase,
  uSetBooks,
  uSetItems,
  bookId,
  book,
  bookIndex,
  stack,
  shelf,
  uYear,
  removing,
  otherUser,
  position,
  tilting,
  showingModal,
  setShowingModal,
}) {
  const [showModal, setShowModal] = useState(false);
  // Mutations
  const [arrangeBookcase, { error: arrangeError }] = useMutation(
    ARRANGE_BOOKCASE,
    {
      refetchQueries: () => [
        {
          query: QUERY_ME,
          variables: { fetchMe: true },
        },
        {
          query: QUERY_BOOKCASE,
          variables: { fetchMe: true, year: uYear },
        },
      ],
    }
  );
  const [removeBook, { error: removeError }] = useMutation(REMOVE_BOOK, {
    refetchQueries: () => [
      {
        query: QUERY_ME,
        variables: { fetchMe: true },
      },
      {
        query: QUERY_BOOKCASE,
        variables: { fetchMe: true, year: uYear },
      },
    ],
  });

  // Function to differentiate between a single and double-click
  let timer;
  function clickHandler(e) {
    clearTimeout(timer);
    e.preventDefault();
    e.stopPropagation();
    // Do the single-click thing in 200 ms
    if (e.detail === 1) {
      timer = setTimeout(() => {
        showInfo();
      }, 200);
      // If a second click happens, do this instead
    } else if (e.detail === 2) {
      unshelveBook();
    }
  }

  function showInfo() {
    // Show the book details modal
    setShowModal(true);
    setShowingModal(true);
  }

  async function unshelveBook() {
    // This function moves a book from a shelf to unshelved

    if (otherUser) return;

    const { 1: thisStack, 2: thisShelf } = stack.split("-");
    // If the book is already unshelved, never mind
    if (shelf === "unshelved") return;

    const allBooks = cloneDeep(uCase);
    const unshelved = allBooks.unshelved;
    // Remove the book from its current stack
    const thisBook = allBooks.shelves[thisShelf][thisStack].splice(
      bookIndex,
      1
    );
    // Now place it at the end of the Unshelved stack
    unshelved.push(thisBook[0]);
    // Now update the states of the bookcase
    uSetCase(allBooks);
    uSetItems(convert(allBooks));

    try {
      // Save the newly arranged bookcase
      const { data } = await arrangeBookcase({
        variables: { bookcase: allBooks },
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteThisBook() {
    // This function removes a book from the user's list and bookcase

    if (otherUser) return;

    const { 1: thisStack, 2: thisShelf } = stack.split("-");
    const allBooks = cloneDeep(uCase);
    const booklist = { ...uBooks, bookList: [...uBooks.bookList] };

    // Which stack is it from?
    const fromStack =
      thisShelf === "unshelved"
        ? allBooks.unshelved
        : allBooks.shelves[thisShelf][thisStack];
    // Remove it from that stack
    fromStack.splice(bookIndex, 1);

    // Now search for the book in the flat list, and remove it there
    let listIndex = 0;
    for (let i = 0; i < booklist.bookList.length; i++) {
      if (
        book.bookId === booklist.bookList[i].bookId &&
        book.audio === booklist.bookList[i].audio
      )
        listIndex = i;
    }
    const thisListBook = booklist.bookList.splice(listIndex, 1);

    // Set all the states
    uSetCase(allBooks);
    uSetItems(convert(allBooks));
    uSetBooks(booklist);
    removing(true);

    try {
      // Save the new bookshelf arrangement
      const { data: arrangeData } = await arrangeBookcase({
        variables: { bookcase: allBooks },
      });
      removing(false);
    } catch (err) {
      console.error(err);
    }

    try {
      // Save the book's removal
      console.log(thisListBook);
      const { data: removeData } = await removeBook({
        variables: {
          bookId: thisListBook[0].bookId,
          audio: thisListBook[0].audio,
          year: book.year,
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Set up flags that properties should be styles and not classes
  const colorStyle = book.color.charAt(0) === "#";
  const heightStyle = !isNaN(book.height);
  const thicknessStyle = !isNaN(book.thickness);
  const textColorStyle = book.text && book.text.charAt(0) === "#";
  const textSizeStyle = book.textSize && parseInt(book.textSize) > 0;

  // Reference logic to set book title style
  const textStyle = isTight(book);
  return (
    <>
      <ViewModal
        show={showModal}
        switcher={setShowModal}
        info={book}
        shelf={shelf}
        remover={deleteThisBook}
        setShowingModal={setShowingModal}
      />
      <Draggable
        key={bookId}
        draggableId={bookId}
        index={bookIndex}
        isDragDisabled={otherUser}
      >
        {(provided) => (
          <li
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={
              showingModal
                ? ""
                : tilting
                ? `book-container ${position} tilted`
                : "book-container"
            }
          >
            <div
              // Class names added for original-style saved books
              className={`book ${colorStyle ? "" : book.color} ${
                thicknessStyle ? "" : book.thickness
              } ${heightStyle ? "" : book.height} ${book.style} ${
                book.audio ? "audio" : ""
              }`}
              id={bookId}
              style={{
                // Styles added for new-style saved books
                backgroundColor: colorStyle ? book.color : "",
                height: heightStyle ? `${book.height}px` : "",
                width: thicknessStyle ? `${book.thickness}px` : "",
                transform: tilting
                  ? calcTilt(position, book.height, book.thickness)
                  : "",
              }}
              onClick={clickHandler}
            >
              <div className="accent top"></div>
              <div className="spineText">
                <span
                  key="title"
                  className="title"
                  style={{
                    color:
                      textColorStyle && colorStyle
                        ? book.text
                        : !colorStyle &&
                          book.color !== "white" &&
                          book.color !== "yellow"
                        ? "white"
                        : textColorStyle
                        ? book.text
                        : "black",
                    // Font size and line height adjusted based on available space
                    fontSize: textSizeStyle
                      ? `${book.textSize}px`
                      : book.thickness === "thin" || book.thickness < 28
                      ? "8px"
                      : book.thickness === "mid" || book.thickness < 35
                      ? "10px"
                      : "",
                    lineHeight: textSizeStyle
                      ? `${parseInt(book.textSize) + 1}px`
                      : book.thickness === "thin" || book.thickness < 28
                      ? "9px"
                      : book.thickness === "mid" || book.thickness < 35
                      ? "11px"
                      : "",
                  }}
                >
                  {book.shortTitle && book.shortTitle.length > 0
                    ? book.shortTitle
                    : textStyle === "tightest"
                    ? titleSmooshing(book.title, "abbrev")
                    : book.title}
                  {book.audio ? <div className="aud">🎧</div> : ""}
                </span>
              </div>
              <div className="accent bottom"></div>
            </div>
          </li>
        )}
      </Draggable>
    </>
  );
}

export { Book };
