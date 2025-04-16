import { useState, useEffect, useRef } from "react";

const NAV_DATA = {
  Assays: [
    {
      label: "Flow Cytometry",
      children: [
        { label: "Designing flow cytometry experiments", href: "#" },
        { label: "Collecting/fixing adherent cells", href: "#" },
        { label: "Fixing and Staining cells", href: "#" },
      ],
    },
    {
      label: "Western Blotting",
      children: [
        { label: "RIPA Lysis", href: "#" },
        { label: "Western Blotting (NuPage)", href: "#" },
      ],
    },
    { label: "qPCR", href: "#" },
    {
      label: "Single Cell Transcriptomics",
      children: [
        { label: "10X Single Cell Prep Guide", href: "#" },
        { label: "10X Flex Prep for Fixed Cells", href: "#" },
      ],
    },
  ],
  "Tissue Culture": [
    {
      label: "N2As",
      children: [
        { label: "N2A Transfection", href: "#" },
        { label: "N2A Passaging", href: "#" },
        { label: "Freezing/Thawing Stable Lines", href: "#" },
        { label: "Katya’s N2A Protocol", href: "#" },
      ],
    },
    {
      label: "i3N (induced neurons)",
      children: [
        { label: "i3Nv2 - NIM", href: "#" },
        { label: "i3Nv2 - NMM", href: "#" },
        { label: "i3Nv2 - NM2", href: "#" },
        { label: "iN3 Neurons", href: "#" },
      ],
    },
  ],
};

const LOCAL_STORAGE_KEY = "activeNavbarTab";

function AppNavbar() {
  const [activeTab, setActiveTab] = useState("Assays");
  const [flyout, setFlyout] = useState(null);
  const [tabsVisible, setTabsVisible] = useState(false);
  const navbarRef = useRef(null);

  useEffect(() => {
    const savedTab = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedTab && NAV_DATA[savedTab]) {
      setActiveTab(savedTab);
    }

    const handleClickOutside = (event) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target) &&
        !document.querySelector("header")?.contains(event.target)
      ) {
        setTabsVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem(LOCAL_STORAGE_KEY, tab);
    setTabsVisible(true);
  };

  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  return (
    <div
      ref={navbarRef}
      className="sticky top-16 z-50 bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      {/* Supercategory Tabs */}
      <div className="flex justify-start space-x-2 py-2 px-4 overflow-x-auto">
        {Object.keys(NAV_DATA).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full font-semibold transition-colors duration-200 text-sm ${
              activeTab === tab && tabsVisible
                ? "bg-blue-100 text-blue-700 dark:bg-blue-400 dark:text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Second-Level Nav */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          tabsVisible ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-wrap sm:flex-nowrap justify-start space-x-4 overflow-x-auto px-4 py-2">
          {NAV_DATA[activeTab].map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => !isTouchDevice() && setFlyout(item.label)}
              onMouseLeave={() => !isTouchDevice() && setFlyout(null)}
              onClick={() => isTouchDevice() && setFlyout(item.label === flyout ? null : item.label)}
            >
              <button
                className="text-sm font-medium text-gray-700 dark:text-gray-200 border-b-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 px-2 pb-1"
              >
                {item.label}
              </button>
              {flyout === item.label && item.children && (
                <div className="fixed bg-white dark:bg-gray-800 rounded-md shadow-lg mt-1 py-2 px-4 z-50 ring-1 ring-black ring-opacity-5">
                  <ul className="space-y-1">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <a
                          href={child.href}
                          className="block px-2 py-1 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {child.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AppNavbar;