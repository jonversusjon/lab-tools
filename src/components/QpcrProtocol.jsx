import { useState, useEffect, useRef } from "react";
import {
  calculateMasterMixTable,
  copyTableToClipboard as copyTableToClipboardUtil,
} from "../utils";
import PlateMapCollector from "./PlateMapGenerator/PlateMapCollector";

function QpcrProtocol() {
  const [numSamples, setNumSamples] = useState(1);
  const [includeOverage, setIncludeOverage] = useState(true);
  const [overagePercent, setOveragePercent] = useState(20);
  const [masterMixTable, setMasterMixTable] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const copyTimeoutRef = useRef(null);
  const [plates, setPlates] = useState([]);
  const [showPlateMapSection, setShowPlateMapSection] = useState(false);

  // Thermal cycler conditions
  const thermalCyclerConditions = [
    { temp: "48°C", time: "15:00" },
    { temp: "95°C", time: "10:00" },
    { temp: "95°C", time: "0:15", cycles: "40" },
    { temp: "60°C", time: "1:00", cycles: "40" },
  ];

  // Calculate the master mix table based on number of samples and overage
  useEffect(() => {
    setMasterMixTable(
      calculateMasterMixTable(numSamples, includeOverage, overagePercent)
    );
  }, [numSamples, includeOverage, overagePercent]);

  // Function to convert master mix table to a format Notion will recognize
  const copyTableToClipboard = () => {
    const success = copyTableToClipboardUtil(
      masterMixTable,
      numSamples,
      includeOverage,
      overagePercent
    );

    if (success) {
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
    }
  };

  // Handle changes to the plate collection
  const handlePlatesChange = (updatedPlates) => {
    setPlates(updatedPlates);
  };

  // Toggle plate map section visibility
  const togglePlateMapSection = () => {
    setShowPlateMapSection(!showPlateMapSection);
  };

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-center text-blue-600 dark:text-blue-400 mb-2">
        qPCR Protocol
      </h1>
      <p className="text-right italic mb-6 text-gray-600 dark:text-gray-300">
        by Michelle
      </p>

      {/* Reagents Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">
          Reagents
        </h2>
        <div className="ml-4">
          <ul className="list-disc ml-6 mb-4 text-gray-800 dark:text-gray-50">
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
              <div className="bg-amber-50 dark:bg-amber-950/10 border-l-4 border-yellow-500 dark:border-yellow-400 p-3 my-2 rounded-r">
                <span className="text-yellow-500 dark:text-yellow-400 text-xl">
                  ⭐
                </span>{" "}
                <span className="text-amber-800 dark:text-amber-300">
                  Can thaw at RT, but then keep on ice
                </span>
              </div>
            </li>
            <li className="mb-3">
              <p className="font-semibold">-80</p>
              <ul className="list-disc ml-6">
                <li>RNA samples</li>
              </ul>
            </li>
            <li>
              plates and plate covers are in top drawer next to Melissa's desk
            </li>
            <li>use RNAse free water for MM and no-template control</li>
          </ul>
        </div>
      </section>

      {/* Master Mix Calculator Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">
          Master Mix Calculator
        </h2>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex items-center">
            <label
              htmlFor="numSamples"
              className="mr-2 font-medium text-gray-800 dark:text-gray-50"
            >
              Number of Samples:
            </label>
            <div className="flex items-center">
              <button
                type="button"
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-50 w-8 h-8 rounded-l flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setNumSamples(Math.max(1, numSamples - 1))}
                aria-label="Decrease samples"
              >
                -
              </button>
              <input
                id="numSamples"
                type="number"
                min="1"
                className="border border-gray-200 dark:border-gray-700 border-x-0 px-2 py-1 w-20 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-50 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-600/20 dark:focus:ring-blue-400/30 focus:outline-none transition-colors duration-200 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={numSamples}
                onChange={(e) =>
                  setNumSamples(Math.max(1, parseInt(e.target.value) || 1))
                }
              />
              <button
                type="button"
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-50 w-8 h-8 rounded-r flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setNumSamples(numSamples + 1)}
                aria-label="Increase samples"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="includeOverage"
              type="checkbox"
              className="h-4 w-4 text-blue-600 dark:text-blue-400 border-gray-200 dark:border-gray-700 rounded focus:ring-blue-600 dark:focus:ring-blue-400"
              checked={includeOverage}
              onChange={(e) => setIncludeOverage(e.target.checked)}
            />
            <label
              htmlFor="includeOverage"
              className="mr-2 font-medium text-gray-800 dark:text-gray-50"
            >
              Include Overage
            </label>

            {includeOverage && (
              <>
                <input
                  id="overagePercent"
                  type="number"
                  min="1"
                  max="100"
                  className="border border-gray-200 dark:border-gray-700 rounded px-2 py-1 w-16 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-50 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-600/20 dark:focus:ring-blue-400/30 focus:outline-none transition-colors duration-200"
                  value={overagePercent}
                  onChange={(e) =>
                    setOveragePercent(
                      Math.max(1, Math.min(100, parseInt(e.target.value) || 20))
                    )
                  }
                />
                <span className="text-gray-800 dark:text-gray-50">%</span>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Table styling using Tailwind classes */}
          <div className="max-w-3xl overflow-hidden rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div></div>
              <button
                onClick={copyTableToClipboard}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white dark:text-gray-50 font-medium py-1.5 px-3 rounded-md transition-colors duration-200 text-sm shadow-sm hover:shadow"
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
                  <span className="ml-1 text-green-500 dark:text-green-400">
                    ✓
                  </span>
                )}
              </button>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-blue-600 dark:bg-blue-400 text-white dark:text-gray-50 font-semibold text-left p-3 border-b border-blue-700 dark:border-blue-500">
                    Reagent
                  </th>
                  <th className="bg-blue-600 dark:bg-blue-400 text-white dark:text-gray-50 font-semibold text-left p-3 border-b border-blue-700 dark:border-blue-500">
                    Volume
                  </th>
                  <th className="bg-blue-600 dark:bg-blue-400 text-white dark:text-gray-50 font-semibold text-left p-3 border-b border-blue-700 dark:border-blue-500">
                    x {numSamples} sample{numSamples !== 1 ? "s" : ""}{" "}
                    {includeOverage ? `(+${overagePercent}% overage)` : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {masterMixTable.map((reagent, index) => (
                  <tr
                    key={index}
                    className={`${
                      reagent.isTotal ? "font-bold" : ""
                    } dark:text-gray-50 bg-white dark:bg-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors duration-150`}
                  >
                    <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                      {reagent.name}
                    </td>
                    <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                      {reagent.volume} {reagent.unit}
                    </td>
                    <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                      {reagent.totalVolume} {reagent.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Plate Map Section - New Addition */}
      <section className="mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">
            Plate Maps
          </h2>
          <button
            onClick={togglePlateMapSection}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            {showPlateMapSection ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Hide Plate Maps
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Show Plate Maps
              </>
            )}
          </button>
        </div>

        {showPlateMapSection && (
          <div className="mt-4">
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Design your plate layout below. You can add multiple plates,
              select different plate types, and customize well colors.
            </p>
            <PlateMapCollector
              onPlatesChange={handlePlatesChange}
              initialPlates={plates}
            />
          </div>
        )}
      </section>

      {/* Protocol Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">
          Protocol
        </h2>
        <ol className="list-decimal ml-6 space-y-4 text-gray-800 dark:text-gray-50">
          <li>Calculate MM, enough for 20% overage</li>
          <li>Add 9μL per well in 384 well plate</li>
          <li>
            Then add 1 μL template RNA to each well
            <ul className="list-disc ml-6 mt-2 text-gray-600 dark:text-gray-300">
              <li>
                It is useful to open a new box of pipette tips and use one for
                each well, to help keep track of which wells you've loaded
              </li>
            </ul>
          </li>
          <li>
            Cover with plate cover, use a marker around the edge and over the
            wells to ensure good seal
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
                Add detectors. Select VIC and FAM for wells, load them in and
                then check their check boxes
              </li>
              <li>
                Ensure thermal cycler conditions are right
                <div className="max-w-3xl mt-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-blue-600 dark:bg-blue-400 text-white dark:text-gray-50 font-semibold text-left p-3 border-b border-blue-700 dark:border-blue-500">
                          Temp
                        </th>
                        <th className="bg-blue-600 dark:bg-blue-400 text-white dark:text-gray-50 font-semibold text-left p-3 border-b border-blue-700 dark:border-blue-500">
                          Time
                        </th>
                        <th className="bg-blue-600 dark:bg-blue-400 text-white dark:text-gray-50 font-semibold text-left p-3 border-b border-blue-700 dark:border-blue-500">
                          Cycles
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {thermalCyclerConditions.map((condition, index) => (
                        <tr
                          key={index}
                          className="bg-white dark:bg-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                        >
                          <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                            {condition.temp}
                          </td>
                          <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                            {condition.time}
                          </td>
                          <td className="p-3 border-b border-gray-200 dark:border-gray-700">
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
  );
}

export default QpcrProtocol;
