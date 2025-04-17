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

/**
 * Plate Map Selection Utilities
 */

/**
 * Generate well ID from row and column indices
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {Array} rowLabels - Array of row labels (e.g., ['A', 'B', 'C',...])
 * @param {Array} colLabels - Array of column labels (e.g., ['1', '2', '3',...])
 * @returns {string} Well ID (e.g., 'A1')
 */
export const getWellId = (row, col, rowLabels, colLabels) => {
  return `${rowLabels[row]}${colLabels[col]}`;
};

/**
 * Get row and column indices from well ID
 * @param {string} wellId - Well ID (e.g., 'A1')
 * @param {Array} rowLabels - Array of row labels (e.g., ['A', 'B', 'C',...])
 * @param {Array} colLabels - Array of column labels (e.g., ['1', '2', '3',...])
 * @returns {Object} Object with row and col indices
 */
export const getWellIndices = (wellId, rowLabels, colLabels) => {
  if (!wellId || typeof wellId !== "string") {
    console.error("Invalid wellId provided to getWellIndices:", wellId);
    return { row: -1, col: -1 };
  }

  // Extract row and column labels from the wellId
  const rowLabel = wellId.charAt(0);
  const colLabel = wellId.substring(1);

  // Find the indices in the label arrays
  const row = rowLabels.indexOf(rowLabel);
  const col = colLabels.indexOf(colLabel);

  if (row === -1 || col === -1) {
    console.warn(`Could not find indices for well ${wellId} with labels:`, {
      rowLabels,
      colLabels,
    });
  }

  return { row, col };
};

/**
 * Get all wells in a row
 * @param {number} rowIndex - Row index
 * @param {Array} rowLabels - Array of row labels
 * @param {Array} colLabels - Array of column labels
 * @returns {Array} Array of well IDs in the row
 */
export const getRowWells = (rowIndex, rowLabels, colLabels) => {
  const rowLabel = rowLabels[rowIndex];
  return colLabels.map((col) => `${rowLabel}${col}`);
};

/**
 * Get all wells in a column
 * @param {number} colIndex - Column index
 * @param {Array} rowLabels - Array of row labels
 * @param {Array} colLabels - Array of column labels
 * @returns {Array} Array of well IDs in the column
 */
export const getColumnWells = (colIndex, rowLabels, colLabels) => {
  const colLabel = colLabels[colIndex];
  return rowLabels.map((row) => `${row}${colLabel}`);
};

/**
 * Get wells in a rectangular region
 * @param {Object} startWell - { row, col } of start well
 * @param {Object} endWell - { row, col } of end well
 * @param {Array} rowLabels - Array of row labels
 * @param {Array} colLabels - Array of column labels
 * @returns {Array} Array of well IDs in the region
 */
export const getRectangularRegion = (
  startWell,
  endWell,
  rowLabels,
  colLabels
) => {
  const startRow = Math.min(startWell.row, endWell.row);
  const endRow = Math.max(startWell.row, endWell.row);
  const startCol = Math.min(startWell.col, endWell.col);
  const endCol = Math.max(startWell.col, endWell.col);

  const wells = [];

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      wells.push(getWellId(r, c, rowLabels, colLabels));
    }
  }

  return wells;
};

/**
 * Get wells in a region between two rows
 * @param {number} startRowIndex - Starting row index
 * @param {number} endRowIndex - Ending row index
 * @param {Array} rowLabels - Array of row labels
 * @param {Array} colLabels - Array of column labels
 * @returns {Array} Array of well IDs in the region
 */
export const getRowRegion = (
  startRowIndex,
  endRowIndex,
  rowLabels,
  colLabels
) => {
  const startRow = Math.min(startRowIndex, endRowIndex);
  const endRow = Math.max(startRowIndex, endRowIndex);

  const wells = [];

  for (let r = startRow; r <= endRow; r++) {
    wells.push(...getRowWells(r, rowLabels, colLabels));
  }

  return wells;
};

/**
 * Get wells in a region between two columns
 * @param {number} startColIndex - Starting column index
 * @param {number} endColIndex - Ending column index
 * @param {Array} rowLabels - Array of row labels
 * @param {Array} colLabels - Array of column labels
 * @returns {Array} Array of well IDs in the region
 */
export const getColumnRegion = (
  startColIndex,
  endColIndex,
  rowLabels,
  colLabels
) => {
  const startCol = Math.min(startColIndex, endColIndex);
  const endCol = Math.max(startColIndex, endColIndex);

  const wells = [];

  for (let c = startCol; c <= endCol; c++) {
    wells.push(...getColumnWells(c, rowLabels, colLabels));
  }

  return wells;
};

/**
 * Toggle selection state for a set of wells
 * @param {Array} wells - Array of well IDs to toggle
 * @param {Array} selectedWells - Currently selected wells
 * @returns {Array} Updated selection array
 */
export const toggleWellSelection = (wells, selectedWells) => {
  if (
    !wells ||
    !Array.isArray(wells) ||
    !selectedWells ||
    !Array.isArray(selectedWells)
  ) {
    console.error("Invalid parameters to toggleWellSelection:", {
      wells,
      selectedWells,
    });
    return selectedWells || [];
  }

  // Check if all wells are already selected
  const allSelected = wells.every((well) => selectedWells.includes(well));

  if (allSelected) {
    // If all are selected, deselect them
    return selectedWells.filter((well) => !wells.includes(well));
  } else {
    // Otherwise, add any that aren't selected yet
    const newSelection = [...selectedWells];
    wells.forEach((well) => {
      if (!newSelection.includes(well)) {
        newSelection.push(well);
      }
    });
    return newSelection;
  }
};

/**
 * Get wells inside a selection rectangle
 * @param {Object} rect - { startX, startY, endX, endY } in screen coordinates
 * @param {Object} wellPositions - Map of well IDs to their screen positions { wellId: { x, y, width, height } }
 * @returns {Array} Array of well IDs inside the rectangle
 */
export const getWellsInRectangle = (rect, wellPositions) => {
  if (!rect || !wellPositions) {
    console.error("Invalid parameters to getWellsInRectangle:", {
      rect,
      wellPositions,
    });
    return [];
  }

  const { startX, startY, endX, endY } = rect;
  const left = Math.min(startX, endX);
  const right = Math.max(startX, endX);
  const top = Math.min(startY, endY);
  const bottom = Math.max(startY, endY);

  return Object.entries(wellPositions)
    .filter(([, pos]) => {
      // Check if well is fully inside the rectangle
      return (
        pos.x >= left &&
        pos.x + pos.width <= right &&
        pos.y >= top &&
        pos.y + pos.height <= bottom
      );
    })
    .map(([wellId]) => wellId);
};
