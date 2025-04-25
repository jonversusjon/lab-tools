import { useState } from "react";

function AppHeader({ darkMode, toggleDarkMode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-300 sticky top-0 z-50">
      <div className="px-4 flex items-center justify-between h-16 relative">
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleMenu}
          className="p-2 rounded-md text-gray-800 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 focus:ring-opacity-30 transition-all duration-200"
          aria-label="Main menu"
          aria-expanded={menuOpen}
        >
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* App Title */}
        <h1 className="text-xl md:text-2xl font-bold text-black dark:text-gray-50 text-center">
          Lab Tools (Notion Supplement)
        </h1>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        {/* Mobile Menu Flyout */}
        {menuOpen && (
          <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 shadow-lg p-4 border-t border-gray-200 dark:border-gray-700 transition-all duration-300 transform origin-top z-50">
            <div className="space-y-3">
              <a
                href="#"
                className="block py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-50 transition-colors duration-200"
              >
                Home
              </a>
              <a
                href="#"
                className="block py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-50 transition-colors duration-200"
              >
                Protocols
              </a>
              <a
                href="#"
                className="block py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-50 transition-colors duration-200"
              >
                About
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
