// This page displays the bookcase

import "./Bookcase.css";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { ARRANGE_BOOKCASE } from "../../utils/mutations";
import {
  QUERY_ME,
  QUERY_BOOKCASE,
  QUERY_USER_BOOKCASE,
} from "../../utils/queries";
import { DragDropContext } from "@hello-pangea/dnd";
import { Shelf, Button, TitleBar } from "../../components";
import Auth from "../../utils/auth";
import { convert, noSpace } from "../../utils/dragUtils";
import { cloneDeep } from "lodash";

function Bookcase({ uCase, uBooks, uSetBooks, uSetCase, uYear, uSetYear }) {
  const params = useParams();
  const otherUser = params.user;
  const otherYear = params.year;
  const userData = Auth.loggedIn()
    ? Auth.getProfile().data
    : { lookupName: "" };

  // If the user is logged in, construct the URL to share the bookcase
  const loc = String(window.location.href).split("/");
  let reference = `${loc[0]}//${loc[2]}/#/bookcase/${userData.lookupName}/${uYear}`;

  // If the user isn't logged in, send them to the home page
  // if (!Auth.loggedIn()) window.location.href = "/";

  // What if it's a different user?
  const { loading: loadingCase, data: dataCase } = useQuery(
    QUERY_USER_BOOKCASE,
    {
      variables: {
        year: otherYear || "no-request",
        user: otherUser || "no-request",
      },
    }
  );

  // We've made the bookcase query...are there shelves returned?
  const userShelves = !(!loadingCase && !dataCase.userBookcase.shelves);
  // If we've received some other user's bookcase use that...otherwise logged-in user's
  const useThisCase = userShelves && dataCase ? dataCase.userBookcase : uCase;
  const userLabel = loadingCase
    ? "loading..."
    : dataCase.userBookcase.userName || "none";

  // State to arrange books on shelves
  const [items, setItems] = useState(convert(useThisCase));
  const [removing, setRemoving] = useState(false);
  const [showingModal, setShowingModal] = useState(false);

  // Mutation
  const [arrangeBookcase, { error }] = useMutation(ARRANGE_BOOKCASE, {
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

  async function handleDrop({ source, destination }) {
    // Handler for when a book is dropped onto a stack

    // Check to see if the there is even a destination
    if (!destination) return;

    const { 1: fromStack, 2: fromShelf } = source.droppableId.split("-");
    const { 1: toStack, 2: toShelf } = destination.droppableId.split("-");

    if (
      // If the destination isn't unshelved, check to see if there's room for this book
      !(toShelf === "unshelved" || fromShelf === toShelf) &&
      noSpace(
        uCase.shelves[toShelf],
        fromShelf === "unshelved"
          ? uCase.unshelved[source.index]
          : uCase.shelves[fromShelf][fromStack][source.index]
      )
    ) {
      // If there isn't room, forget it
      return;
    }

    // OK to drop it here, handle the drop
    const newUser = cloneDeep(uCase);

    // Create a copy of the source and destination stacks
    const bSourceStack =
      fromStack === "unshelved"
        ? [...uCase.unshelved]
        : [...uCase.shelves[fromShelf][fromStack]];
    const bDestStack =
      source.droppableId === destination.droppableId
        ? bSourceStack
        : toStack === "unshelved"
        ? [...uCase.unshelved]
        : [...uCase.shelves[toShelf][toStack]];

    // Remove the book from the source...
    const [removedBook] = bSourceStack.splice(source.index, 1);
    // ...and add it to the specified place in the destination
    bDestStack.splice(destination.index, 0, removedBook);

    // Place the edited stacks into the copy of the state, and set states
    fromShelf === "unshelved"
      ? (newUser.unshelved = bSourceStack)
      : (newUser.shelves[fromShelf][fromStack] = bSourceStack);
    toShelf === "unshelved"
      ? (newUser.unshelved = bDestStack)
      : (newUser.shelves[toShelf][toStack] = bDestStack);

    // setBookcase(newUser);
    uSetCase({ ...newUser, fetched: true });
    // setItems(convert(newUser));
    setItems(convert(newUser));

    try {
      // Execute mutation and pass in defined parameter data as variables
      const { data } = await arrangeBookcase({
        variables: { bookcase: newUser },
      });
    } catch (err) {
      console.error(err);
    }
  }

  const addShelf = async () => {
    // This function adds two shelves

    // Create a copy of the current bookcase
    const newUser = cloneDeep(uCase);
    // Push two new shelves on
    newUser.shelves.push({ left: [], right: [] });
    newUser.shelves.push({ left: [], right: [] });
    // Set states
    uSetCase(newUser);
    setItems(convert(newUser));
    try {
      // Save the new bookcase configuration
      const { data } = await arrangeBookcase({
        variables: { bookcase: newUser },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const removeEmpties = async () => {
    // This function removes all empty shelves

    // Create a shell of the user, with empty shelves except unshelved
    const newUser = {
      fetched: uCase.fetched,
      user_id: uCase.user_id,
      year: uCase.year,
      shelves: [],
      unshelved: [...uCase.unshelved],
    };
    uCase.shelves.map((shelf) => {
      // Iterate over shelves. If the shelf isn't empty, add to the new configuration
      if (shelf.left.length > 0 || shelf.right.length > 0) {
        newUser.shelves.push({ ...shelf });
      }
      return false;
    });
    if (newUser.shelves.length === 0) {
      // If there are no shelves left, add a pair of empties
      newUser.shelves.push({ left: [], right: [] });
      newUser.shelves.push({ left: [], right: [] });
    }
    if (newUser.shelves.length % 2 === 1) {
      // If there are an odd number of shelves, add one more empty
      newUser.shelves.push({ left: [], right: [] });
    }
    // Set the new states
    // setBookcase(newUser);
    uSetCase(newUser);
    // setItems(convert(newUser));
    setItems(convert(newUser));

    try {
      // Save the new bookcase arrangement
      const { data } = await arrangeBookcase({
        variables: { bookcase: newUser },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {removing && (
        <div id="bookRemoval">
          <h2>Removing book...</h2>
        </div>
      )}
      <main id="bookcaseContainer">
        <section id="bookcase">
          <TitleBar
            type="bookcase"
            uName={userLabel}
            uYear={uYear}
            uSetYear={uSetYear}
            uCase={uCase}
            uSetCase={uSetCase}
            otherUser={otherUser}
            otherYear={otherYear}
            bookCount={
              uBooks.bookList.filter((book) => {
                return book.year === uYear;
              }).length
            }
          />
          <DragDropContext onDragEnd={handleDrop}>
            <div id="shelves">
              {useThisCase.shelves.map((shelf, shelfIndex) => {
                return (
                  <Shelf
                    key={shelfIndex}
                    shelfIndex={shelfIndex}
                    uBooks={uBooks}
                    uCase={useThisCase}
                    uItems={items}
                    uSetBooks={uSetBooks}
                    uSetItems={setItems}
                    uSetCase={uSetCase}
                    uYear={uYear}
                    otherUser={otherUser && otherYear ? true : false}
                    showingModal={showingModal}
                    setShowingModal={setShowingModal}
                  />
                );
              })}
            </div>
            <Shelf
              key="unshelved"
              shelfIndex="unshelved"
              uCase={useThisCase}
              uBooks={uBooks}
              uItems={items}
              uSetBooks={uSetBooks}
              uSetItems={setItems}
              uSetCase={uSetCase}
              uYear={uYear}
              otherUser={otherUser && otherYear ? true : false}
              removing={setRemoving}
              showingModal={showingModal}
              setShowingModal={setShowingModal}
            />
          </DragDropContext>
          {!otherUser && (
            <>
              <Button className="bookcaseButton" handler={addShelf}>
                Add a shelf
              </Button>
              <Button className="bookcaseButton" handler={removeEmpties}>
                Delete empty shelves
              </Button>
              <p id="reference-link">
                Show your friends:{" "}
                <a href={reference} target="_blank" rel="noreferrer">
                  {reference}
                </a>
              </p>
            </>
          )}
        </section>
      </main>
    </>
  );
}

export { Bookcase };
