import { useState, useEffect } from "react";
import "./App.css";
import AppHeader from "./components/AppHeader";
import QpcrProtocol from "./components/QpcrProtocol";
import AppNavbar from "./components/AppNavbar";
import {
  initializeDarkMode,
  toggleDarkMode as toggleDarkModeUtil,
  applyDarkMode,
} from "./utils";

function App() {
  const [darkMode, setDarkMode] = useState(initializeDarkMode);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = toggleDarkModeUtil(darkMode);
    setDarkMode(newDarkMode);
  };

  // Apply dark mode class on component mount and when darkMode state changes
  useEffect(() => {
    applyDarkMode(darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Add AppHeader component */}
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <AppNavbar />
      <div className="pt-6 pb-10 px-4">
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 transition-colors duration-300">
          {/* Use the QpcrProtocol component */}
          <QpcrProtocol />
        </div>
      </div>
    </div>
  );
}

export default App;
