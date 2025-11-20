// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./home/Home.jsx";
import { UserProvider } from "./LevelContext.js";
// import Action from "./components/action.jsx";

function App() {
  //   return (
  //     <Router>
  //       <div className="App">
  //         <Routes>
  //           <Route path="/" element={<Home />} />
  //         </Routes>
  //       </div>
  //     </Router>
  //   );
  // }

  const [userLevel, setUserLevel] = useState(null);

  // Check for existing session on app load
  useEffect(() => {
    const savedSession = localStorage.getItem("ticketSession");
    if (savedSession) {
      try {
        const { user } = JSON.parse(savedSession);
        if (user?.cs_user_level) {
          setUserLevel(user.cs_user_level);
        }
      } catch (error) {
        console.error("Error restoring session:", error);
        localStorage.removeItem("ticketSession");
      }
    }
  }, []);

  return (
    <UserProvider userLevel={userLevel}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home onUserLevelChange={setUserLevel} />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
