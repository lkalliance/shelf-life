import "./App.css";
import { RecoilRoot } from "recoil";
import { Bookcase } from "./pages";
import { LoginForm } from "./components";
import { SignupForm } from "./components";
import { createContext, useState } from "react";
export const SignupContext = createContext();
// export const loginContext = createContext()

function App() {
  const [showSignupModal, setShowSignupModal] = useState(false);
  // const [showloginModal, setShowloginModal] = useState(false)
  return (
    <RecoilRoot>
      <SignupContext.Provider value={{ showSignupModal, setShowSignupModal }}>
        <div className="App">
          <header>Starter code</header>

          <Bookcase />
          <LoginForm />
          <SignupForm />
        </div>
      </SignupContext.Provider>
    </RecoilRoot>
  );
}

export default App;
