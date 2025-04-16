import { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [numSamples, setNumSamples] = useState(1);
  const [includeOverage, setIncludeOverage] = useState(true);
  const [overagePercent, setOveragePercent] = useState(20);
  const [masterMixTable, setMasterMixTable] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const copyTimeoutRef = useRef(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize dark mode based on localStorage or system preference
    return (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    // Update localStorage and HTML class
    if (newDarkMode) {
      localStorage.theme = "dark";
      document.documentElement.classList.add("dark");
    } else {
      localStorage.theme = "light";
      document.documentElement.classList.remove("dark");
    }
  };

  // Apply dark mode class on component mount and when darkMode state changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Thermal cycler conditions
  const thermalCyclerConditions = [
    { temp: "48°C", time: "15:00" },
    { temp: "95°C", time: "10:00" },
    { temp: "95°C", time: "0:15", cycles: "40" },
    { temp: "60°C", time: "1:00", cycles: "40" },
  ];

  useEffect(() => {
    // Fetch data from Flask backend
    fetch("http://localhost:5001/api/hello")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Calculate the master mix table based on number of samples and overage
  useEffect(() => {
    // Master mix component information
    const reagents = [
      { name: "RT-PCR Mix 2X", volume: 5, unit: "μL" },
      { name: "Assay (20X) EACH", volume: 0.5, unit: "μL" },
      { name: "RT Enzyme Mix (40X)", volume: 0.25, unit: "μL" },
      { name: "H2O", volume: 2.75, unit: "μL" },
      { name: "Template", volume: 1, unit: "μL" },
    ];

    const calculatedTable = reagents.map((reagent) => {
      const multiplier = includeOverage
        ? numSamples * (1 + overagePercent / 100)
        : numSamples;

      const totalVolume = reagent.volume * multiplier;

      return {
        ...reagent,
        totalVolume: parseFloat(totalVolume.toFixed(2)),
      };
    });

    // Calculate total volume per reaction and overall total
    const totalPerReaction = reagents.reduce(
      (sum, reagent) => sum + reagent.volume,
      0
    );
    const totalVolume = calculatedTable.reduce(
      (sum, reagent) => sum + reagent.totalVolume,
      0
    );

    setMasterMixTable([
      ...calculatedTable,
      {
        name: "Total",
        volume: totalPerReaction,
        unit: "μL",
        totalVolume: parseFloat(totalVolume.toFixed(2)),
        isTotal: true,
      },
    ]);
  }, [numSamples, includeOverage, overagePercent]);

  // Function to convert master mix table to a format Notion will recognize
  const copyTableToClipboard = () => {
    try {
      // Create an invisible HTML table element to use for copying
      const tempTable = document.createElement("table");

      // Create header row
      const headerRow = document.createElement("tr");
      [
        "Reagent",
        "Volume",
        `x ${numSamples} sample${numSamples !== 1 ? "s" : ""} ${
          includeOverage ? `(+${overagePercent}% overage)` : ""
        }`,
      ].forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
      });
      tempTable.appendChild(headerRow);

      // Add each data row
      masterMixTable.forEach((reagent) => {
        const tr = document.createElement("tr");
        [
          reagent.name,
          `${reagent.volume} ${reagent.unit}`,
          `${reagent.totalVolume} ${reagent.unit}`,
        ].forEach((cell) => {
          const td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
        tempTable.appendChild(tr);
      });

      // Add the table to the document temporarily (invisible)
      tempTable.style.position = "absolute";
      tempTable.style.left = "-9999px";
      document.body.appendChild(tempTable);

      // Select the table
      const range = document.createRange();
      range.selectNode(tempTable);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      // Copy the selection
      document.execCommand("copy");

      // Clean up
      selection.removeAllRanges();
      document.body.removeChild(tempTable);

      // Show success message
      setCopySuccess(true);

      // Clear previous timeout if exists
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      // Hide success message after 2 seconds
      copyTimeoutRef.current = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-10 px-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 transition-colors duration-200">
        {/* Dark Mode Toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-200"
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
        </div>

        <div className="flex justify-center space-x-6 mb-8">
          <a
            href="https://vite.dev"
            target="_blank"
            className="hover:opacity-80"
          >
            <img src={viteLogo} className="h-12" alt="Vite logo" />
          </a>
          <a
            href="https://react.dev"
            target="_blank"
            className="hover:opacity-80"
          >
            <img
              src={reactLogo}
              className="h-12 animate-spin-slow"
              alt="React logo"
            />
          </a>
        </div>

        {/* qPCR Protocol Content */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center text-indigo-600 mb-2">
            qPCR Protocol
          </h1>
          <p className="text-right italic mb-6">by Michelle</p>

          {/* Reagents Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">
              Reagents
            </h2>
            <div className="ml-4">
              <ul className="list-disc ml-6 mb-4">
                <li className="mb-3">
                  <p className="font-semibold">-20, Melissa's Taqman Box</p>
                  <ul className="list-disc ml-6">
                    <li>2X master mix (big bottle)</li>
                    <li>Reverse Transcriptase (purple cap tube)</li>
                    <li>
                      Probes aka Assay (narrow tubes)
                      <ul className="list-disc ml-6">
                        <li>keep in the dark, these have the fluorophores</li>
                      </ul>
                    </li>
                  </ul>
                  <div className="bg-amber-50 dark:bg-amber-900 border-l-4 border-amber-400 dark:border-amber-500 p-3 my-2">
                    <span className="text-amber-500 dark:text-amber-300 text-xl">
                      ⭐
                    </span>{" "}
                    Can thaw at RT, but then keep on ice
                  </div>
                </li>
                <li className="mb-3">
                  <p className="font-semibold">-80</p>
                  <ul className="list-disc ml-6">
                    <li>RNA samples</li>
                  </ul>
                </li>
                <li>
                  plates and plate covers are in top drawer next to Melissa's
                  desk
                </li>
                <li>use RNAse free water for MM and no-template control</li>
              </ul>
            </div>
          </section>

          {/* Master Mix Calculator Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">
              Master Mix Calculator
            </h2>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex items-center">
                <label htmlFor="numSamples" className="mr-2 font-medium">
                  Number of Samples:
                </label>
                <input
                  id="numSamples"
                  type="number"
                  min="1"
                  className="border border-gray-300 rounded px-2 py-1 w-20"
                  value={numSamples}
                  onChange={(e) =>
                    setNumSamples(Math.max(1, parseInt(e.target.value) || 1))
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="includeOverage"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={includeOverage}
                  onChange={(e) => setIncludeOverage(e.target.checked)}
                />
                <label htmlFor="includeOverage" className="mr-2 font-medium">
                  Include Overage
                </label>

                {includeOverage && (
                  <>
                    <input
                      id="overagePercent"
                      type="number"
                      min="1"
                      max="100"
                      className="border border-gray-300 rounded px-2 py-1 w-16"
                      value={overagePercent}
                      onChange={(e) =>
                        setOveragePercent(
                          Math.max(
                            1,
                            Math.min(100, parseInt(e.target.value) || 20)
                          )
                        )
                      }
                    />
                    <span>%</span>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="flex justify-between items-center mb-2">
                <div></div>
                <button
                  onClick={copyTableToClipboard}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1.5 px-3 rounded-md transition-colors text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy to Notebook
                  {copySuccess && (
                    <span className="ml-1 text-green-200">✓</span>
                  )}
                </button>
              </div>
              <table className="min-w-full border-collapse bg-white dark:bg-gray-700 transition-colors duration-200">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-medium">
                      Reagent
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-medium">
                      Volume
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-medium">
                      x {numSamples} sample{numSamples !== 1 ? "s" : ""}{" "}
                      {includeOverage ? `(+${overagePercent}% overage)` : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {masterMixTable.map((reagent, index) => (
                    <tr
                      key={index}
                      className={
                        reagent.isTotal
                          ? "font-bold bg-gray-50 dark:bg-gray-600"
                          : "dark:bg-gray-700"
                      }
                    >
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        {reagent.name}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        {reagent.volume} {reagent.unit}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        {reagent.totalVolume} {reagent.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Protocol Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">
              Protocol
            </h2>
            <ol className="list-decimal ml-6 space-y-4">
              <li>Calculate MM, enough for 20% overage</li>
              <li>Add 9μL per well in 384 well plate</li>
              <li>
                Then add 1 μL template RNA to each well
                <ul className="list-disc ml-6 mt-2">
                  <li>
                    It is useful to open a new box of pipette tips and use one
                    for each well, to help keep track of which wells you've
                    loaded
                  </li>
                </ul>
              </li>
              <li>
                Cover with plate cover, use a marker around the edge and over
                the wells to ensure good seal
              </li>
              <li>Spin plate for a few seconds in large centrifuge</li>
              <li>
                Load into machine:
                <ol className="list-decimal ml-6 mt-2">
                  <li>Turn on machine, turn on computer</li>
                  <li>Open program = SDS 2.3</li>
                  <li>New file</li>
                  <li>Go to "Instrument" tab</li>
                  <li>Select "Connect to Instrument"</li>
                  <li>Select "Open Tray"</li>
                  <li>Put plate into tray</li>
                  <li>Close tray via computer DON'T PUSH TRAY IN</li>
                </ol>
              </li>
              <li>
                Adjust settings on computer:
                <ol className="list-decimal ml-6 mt-2">
                  <li>Select wells you are using (+ctrl for more wells)</li>
                  <li>
                    Add detectors. Select VIC and FAM for wells, load them in
                    and then check their check boxes
                  </li>
                  <li>
                    Ensure thermal cycler conditions are right
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full border-collapse bg-white dark:bg-gray-700">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">
                              Temp
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">
                              Time
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">
                              Cycles
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {thermalCyclerConditions.map((condition, index) => (
                            <tr key={index} className="dark:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-gray-100">
                                {condition.temp}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-gray-100">
                                {condition.time}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-gray-100">
                                {condition.cycles || ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </li>
                  <li>Press start</li>
                </ol>
              </li>
            </ol>
          </section>
        </div>

        {/* Original App Content */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-center text-indigo-600 mb-4">
            App Demo
          </h2>
          <div className="mt-6 text-center">
            <button
              onClick={() => setCount((count) => count + 1)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              count is {count}
            </button>
            <p className="mt-4 text-gray-600">
              Edit <code className="bg-gray-100 px-1 rounded">src/App.jsx</code>{" "}
              and save to test HMR
            </p>
          </div>
          <div className="mt-8 p-4 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800">
              Message from Flask Backend:
            </h2>
            <p className="mt-2 text-gray-600">{message || "Loading..."}</p>
          </div>
          <p className="mt-6 text-center text-gray-500 text-sm">
            Click on the Vite and React logos to learn more
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
