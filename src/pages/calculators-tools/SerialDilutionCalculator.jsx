import React, { useState, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

function SerialDilutionCalculatorContent() {
  const [stockConcentration, setStockConcentration] = useState("");
  const [targetConcentration, setTargetConcentration] = useState("");
  const [dilutionFactor, setDilutionFactor] = useState("");
  const [numDilutions, setNumDilutions] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Clear the error when inputs change
    setError("");
  }, [stockConcentration, targetConcentration, dilutionFactor, numDilutions]);

  const calculateDilutions = () => {
    try {
      // Validate inputs
      const stock = parseFloat(stockConcentration);
      const target = parseFloat(targetConcentration);
      const factor = parseFloat(dilutionFactor);
      const steps = parseInt(numDilutions);

      if (isNaN(stock) || isNaN(target) || isNaN(factor) || isNaN(steps)) {
        setError("Please enter valid numbers for all fields");
        return;
      }

      if (stock <= 0 || target <= 0 || factor <= 1 || steps <= 0) {
        setError(
          "All values must be positive, and dilution factor must be greater than 1"
        );
        return;
      }

      if (target >= stock) {
        setError("Target concentration must be less than stock concentration");
        return;
      }

      // Calculate serial dilutions
      let dilutionSeries = [];
      let currentConcentration = stock;

      for (let i = 0; i <= steps; i++) {
        dilutionSeries.push({
          step: i,
          concentration: currentConcentration,
        });
        currentConcentration = currentConcentration / factor;
      }

      setResults(dilutionSeries);
    } catch (err) {
      setError("An error occurred during calculation: " + err.message);
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Serial Dilution Calculator</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Concentration
              </label>
              <input
                type="number"
                value={stockConcentration}
                onChange={(e) => setStockConcentration(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Concentration
              </label>
              <input
                type="number"
                value={targetConcentration}
                onChange={(e) => setTargetConcentration(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
                placeholder="e.g., 0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dilution Factor
              </label>
              <input
                type="number"
                value={dilutionFactor}
                onChange={(e) => setDilutionFactor(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Dilutions
              </label>
              <input
                type="number"
                value={numDilutions}
                onChange={(e) => setNumDilutions(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-900"
                placeholder="e.g., 5"
              />
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm py-2">
                {error}
              </div>
            )}

            <button
              onClick={calculateDilutions}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
            >
              Calculate
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Results</h2>

          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Step
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Concentration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((result) => (
                    <tr key={result.step}>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                        {result.step}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                        {result.concentration.toExponential(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Enter values and calculate to see results.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap the component with the error boundary
function SerialDilutionCalculator() {
  return (
    <ErrorBoundary>
      <SerialDilutionCalculatorContent />
    </ErrorBoundary>
  );
}

export default SerialDilutionCalculator;
