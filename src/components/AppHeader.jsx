import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

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

        {/* Dark Mode Toggle - Enhanced Version */}
        {/* Dark Mode Toggle - Sleek Version */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="rounded-full w-9 h-9 transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <Sun
              className={`absolute h-5 w-5 transition-all duration-500 ease-in-out text-yellow-500 ${darkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                }`}
            />
            <Moon
              className={`absolute h-5 w-5 transition-all duration-500 ease-in-out text-slate-700 dark:text-slate-300 ${darkMode ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                }`}
            />
          </div>
        </Button>

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
