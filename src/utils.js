/**
 * Utility functions for the ProtoCalc app
 */

/**
 * Initialize dark mode based on localStorage or system preference
 * @returns {boolean} Current dark mode state
 */
export const initializeDarkMode = () => {
  return (
    localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
};

/**
 * Toggle dark mode and update localStorage and HTML class
 * @param {boolean} currentDarkMode - Current dark mode state
 * @returns {boolean} New dark mode state
 */
export const toggleDarkMode = (currentDarkMode) => {
  const newDarkMode = !currentDarkMode;

  // Update localStorage and HTML class
  if (newDarkMode) {
    localStorage.theme = "dark";
    document.documentElement.classList.add("dark");
  } else {
    localStorage.theme = "light";
    document.documentElement.classList.remove("dark");
  }

  return newDarkMode;
};

/**
 * Apply dark mode class to document
 * @param {boolean} darkMode - Current dark mode state
 */
export const applyDarkMode = (darkMode) => {
  if (darkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

/**
 * Calculate the master mix table based on number of samples and overage
 * @param {number} numSamples - Number of samples
 * @param {boolean} includeOverage - Whether to include overage
 * @param {number} overagePercent - Percentage of overage
 * @returns {Array} Calculated master mix table
 */
export const calculateMasterMixTable = (
  numSamples,
  includeOverage,
  overagePercent
) => {
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

  return [
    ...calculatedTable,
    {
      name: "Total",
      volume: totalPerReaction,
      unit: "μL",
      totalVolume: parseFloat(totalVolume.toFixed(2)),
      isTotal: true,
    },
  ];
};

/**
 * Copy master mix table to clipboard in a format Notion will recognize
 * @param {Array} masterMixTable - The master mix table data
 * @param {number} numSamples - Number of samples
 * @param {boolean} includeOverage - Whether overage is included
 * @param {number} overagePercent - Percentage of overage
 * @returns {boolean} Success status
 */
export const copyTableToClipboard = (
  masterMixTable,
  numSamples,
  includeOverage,
  overagePercent
) => {
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

    return true;
  } catch (err) {
    console.error("Error copying to clipboard:", err);
    return false;
  }
};
