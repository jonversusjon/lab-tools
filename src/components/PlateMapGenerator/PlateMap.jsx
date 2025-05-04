import { useState, useEffect, useRef, useCallback } from "react";
import { PLATE_TYPES, PLATE_RATIO } from "./PlateTypes";
import tinycolor from "tinycolor2";
import {
  getWellId,
  getWellIndices,
  getRowWells,
  getColumnWells,
  getRectangularRegion,
  getRowRegion,
  getColumnRegion,
} from "../../utils";

const PlateMap = ({
  plateType = "96-well",
  onWellClick,
  onRowClick,
  onColumnClick,
  onMultipleSelection,
  selectedWells = [],
  wellData = {},
  id,
  onContextMenu,
  legend = { colors: {} },
  previewWells = [], // New prop for wells that are being previewed during selection
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedElement, setSelectedElement] = useState(null);

  // Keep only selection tracking state
  const [lastClickedElement, setLastClickedElement] = useState(null);
  const wellRefs = useRef({});

  // Get plate configuration based on type
  const plateConfig = PLATE_TYPES[plateType] || PLATE_TYPES["96-well"];
  const { rows, cols, type } = plateConfig;

  // Generate row/column labels
  const rowLabels = Array.from({ length: rows }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  const colLabels = Array.from({ length: cols }, (_, i) => (i + 1).toString());

  // Measure container & maintain the correct aspect ratio
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const containerWidth = containerRef.current.clientWidth;
      setDimensions({
        width: containerWidth,
        height: containerWidth / PLATE_RATIO,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [plateType]);

  // Add a helper function to use getWellIndices
  const getWellFromEvent = useCallback(
    (e) => {
      if (!e || !e.target) return null;

      const wellId = e.target.dataset.wellId;
      if (!wellId) return null;

      return {
        id: wellId,
        ...getWellIndices(wellId, rowLabels, colLabels),
      };
    },
    [rowLabels, colLabels]
  );

  // Enhanced well click handler with shift/ctrl support
  const handleWellClick = useCallback(
    (row, col, e) => {
      if (!e) {
        console.warn("Event object missing in handleWellClick");
        e = { shiftKey: false, ctrlKey: false, metaKey: false };
      }

      const wellId = getWellId(row, col, rowLabels, colLabels);

      // Handle shift-click for range selection
      if (e.shiftKey && lastClickedElement) {
        // Only consider the previous click and current click for the region
        const startWell = {
          row:
            lastClickedElement.row !== undefined ? lastClickedElement.row : row,
          col:
            lastClickedElement.col !== undefined ? lastClickedElement.col : col,
        };
        const endWell = { row, col };

        const region = getRectangularRegion(
          startWell,
          endWell,
          rowLabels,
          colLabels
        );

        if (onMultipleSelection) {
          // Add to existing selection instead of replacing it
          onMultipleSelection(region, true);
        }
      }
      // Handle ctrl/cmd-click for toggling selection
      else if (e.ctrlKey || e.metaKey) {
        // Toggle just this well
        if (onWellClick) {
          onWellClick(wellId, row, col);
        }
        setLastClickedElement({ type: "well", row, col, id: wellId });
      }
      // Normal click - toggle just this well
      else {
        setSelectedElement({ type: "well", row, col, id: wellId });
        setLastClickedElement({ type: "well", row, col, id: wellId });
        if (onWellClick) {
          onWellClick(wellId, row, col);
        }
      }
    },
    [lastClickedElement, onWellClick, onMultipleSelection, rowLabels, colLabels]
  );

  // Use getWellFromEvent for global event delegation
  const handleGlobalPlateClick = useCallback(
    (e) => {
      // Only handle clicks directly on the well circles, not their containers
      const well = getWellFromEvent(e);
      if (well) {
        // Use the extracted well information for the click handler
        handleWellClick(well.row, well.col, e);
      }
    },
    [getWellFromEvent, handleWellClick]
  );

  // Add a global click handler to the plate container
  useEffect(() => {
    if (containerRef.current && type === "well") {
      const container = containerRef.current;
      container.addEventListener("click", handleGlobalPlateClick);

      return () => {
        container.removeEventListener("click", handleGlobalPlateClick);
      };
    }
  }, [handleGlobalPlateClick, type]);

  // Add keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lastClickedElement || lastClickedElement.type !== "well") return;

      const { row, col } = lastClickedElement;
      let newRow = row,
        newCol = col;

      switch (e.key) {
        case "ArrowUp":
          newRow = Math.max(0, row - 1);
          break;
        case "ArrowDown":
          newRow = Math.min(rows - 1, row + 1);
          break;
        case "ArrowLeft":
          newCol = Math.max(0, col - 1);
          break;
        case "ArrowRight":
          newCol = Math.min(cols - 1, col + 1);
          break;
        default:
          return;
      }

      if (newRow !== row || newCol !== col) {
        e.preventDefault();
        handleWellClick(newRow, newCol, e);
      }
    };

    const container = containerRef.current;
    container?.addEventListener("keydown", handleKeyDown);
    return () => container?.removeEventListener("keydown", handleKeyDown);
  }, [lastClickedElement, rows, cols, handleWellClick]);

  // Enhanced row click handler with shift/ctrl support
  const handleRowClick = useCallback(
    (row, e) => {
      setSelectedElement({ type: "row", row });
      const rowLabel = rowLabels[row];

      // Handle shift-click for range selection
      if (
        e.shiftKey &&
        lastClickedElement &&
        lastClickedElement.type === "row"
      ) {
        const startRow = lastClickedElement.row;
        const endRow = row;

        const region = getRowRegion(startRow, endRow, rowLabels, colLabels);

        if (onMultipleSelection) {
          // Add to existing selection
          onMultipleSelection(region, true);
        }
      }
      // Handle ctrl/cmd-click for toggling row selection
      else if (e.ctrlKey || e.metaKey) {
        const rowWells = getRowWells(row, rowLabels, colLabels);

        if (onMultipleSelection) {
          // Toggle this row
          onMultipleSelection(rowWells, true);
        }
      }
      // Normal click - toggle just this row
      else {
        setLastClickedElement({ type: "row", row });
        if (onRowClick) {
          // Pass rowLabel to make toggling easier in the parent component
          onRowClick(row, rowLabel);
        }
      }
    },
    [lastClickedElement, onRowClick, onMultipleSelection, rowLabels, colLabels]
  );

  // Enhanced column click handler with shift/ctrl support
  const handleColumnClick = useCallback(
    (col, e) => {
      setSelectedElement({ type: "column", col });

      // Handle shift-click for range selection
      if (
        e.shiftKey &&
        lastClickedElement &&
        lastClickedElement.type === "column"
      ) {
        const startCol = lastClickedElement.col;
        const endCol = col;

        const region = getColumnRegion(startCol, endCol, rowLabels, colLabels);

        if (onMultipleSelection) {
          // Add to existing selection with toggle mode
          onMultipleSelection(region, true);
        }
      }
      // Handle ctrl/cmd-click for toggling column selection
      else if (e.ctrlKey || e.metaKey) {
        const colWells = getColumnWells(col, rowLabels, colLabels);

        if (onMultipleSelection) {
          // Toggle this column
          onMultipleSelection(colWells, true);
        }
      }
      // Normal click - toggle just this column
      else {
        setLastClickedElement({ type: "column", col });
        if (onColumnClick) {
          onColumnClick(col, colLabels[col]);
        }
      }
    },
    [
      lastClickedElement,
      onColumnClick,
      onMultipleSelection,
      rowLabels,
      colLabels,
    ]
  );

  // Helpers
  const isWellSelected = (row, col) =>
    selectedWells.includes(`${rowLabels[row]}${colLabels[col]}`);

  // Check if a row is fully selected
  const isRowSelected = (row) => {
    const rowLabel = rowLabels[row];
    return colLabels.every((col) =>
      selectedWells.includes(`${rowLabel}${col}`)
    );
  };

  // Check if a column is fully selected
  const isColumnSelected = (col) => {
    const colLabel = colLabels[col];
    return rowLabels.every((row) =>
      selectedWells.includes(`${row}${colLabel}`)
    );
  };

  // Get well color based on well data and find any associated labels
  const getWellStyles = (row, col) => {
    const wellId = `${rowLabels[row]}${colLabels[col]}`;
    const data = wellData[wellId] || {};
    const isSelected = selectedWells.includes(wellId);
    const isPreview = previewWells.includes(wellId);

    // Build list of labels to display from legend
    const labels = [];

    // Function to collect labels from the legend for a specific color and type
    const collectLabels = (colorType, color) => {
      if (!color || color === "transparent") return;

      const colorLegend = legend?.colors?.[colorType] || {};
      const colorInfo = colorLegend[color];

      if (colorInfo && colorInfo.label && colorInfo.applyToWells) {
        labels.push({
          text: colorInfo.label,
          color: colorType === "backgroundColor" ? "#000000" : color,
          type: colorType,
        });
      }
    };

    // Check each color type for labels
    collectLabels("fillColor", data.fillColor);
    collectLabels("borderColor", data.borderColor);
    collectLabels("backgroundColor", data.backgroundColor);

    // Determine background color, accounting for selection state
    let backgroundColor = "var(--well-default-bg, #ffffff)";

    if (data.fillColor !== undefined && data.fillColor !== "transparent") {
      backgroundColor = data.fillColor;
    } else if (isSelected) {
      backgroundColor = "rgba(59, 130, 246, 0.5)"; // Light blue background for selected wells
    }

    return {
      backgroundColor: backgroundColor,
      borderColor:
        data.borderColor === "transparent"
          ? "transparent"
          : data.borderColor ||
            (isSelected ? "rgba(59, 130, 246, 1)" : "rgba(209, 213, 219, 1)"),
      // Enhanced shadow/glow using CSS variables for theme awareness
      boxShadow: isSelected
        ? "0 0 0 2px rgba(59, 130, 246, 0.4)"
        : isPreview
        ? // Use CSS variables for the glow effect colors
          "0 0 0 2px var(--well-outline-color), 0 0 8px 2px var(--well-glow-color), 0 1px 3px rgba(0, 0, 0, 0.12)"
        : "none",
      // Add background div style if needed
      backgroundSquare:
        data.backgroundColor === "transparent"
          ? "transparent"
          : data.backgroundColor || "transparent",
      labels: labels,
      isPreview: isPreview,
    };
  };

  // Add CSS variables for theme-aware colors including glow effects
  useEffect(() => {
    // Create a style element to inject CSS variables
    const style = document.createElement("style");
    style.innerHTML = `
      :root {
        --well-default-bg: #ffffff;
        --well-glow-color: rgba(59, 130, 246, 0.6); /* Blue glow for light mode */
        --well-glow-color-intense: rgba(59, 130, 246, 0.7);
        --well-outline-color: rgba(59, 130, 246, 0.3);
      }
      .dark {
        --well-default-bg: #374151;
        --well-glow-color: rgba(250, 204, 21, 0.6); /* Yellow glow for dark mode - better contrast */
        --well-glow-color-intense: rgba(250, 204, 21, 0.7);
        --well-outline-color: rgba(250, 204, 21, 0.3);
      }
      
      /* Custom animation for subtle pulsing with theme awareness */
      @keyframes pulse-subtle {
        0%, 100% { 
          box-shadow: 0 0 0 2px var(--well-outline-color), 0 0 8px 2px var(--well-glow-color); 
        }
        50% { 
          box-shadow: 0 0 0 2px var(--well-outline-color), 0 0 12px 4px var(--well-glow-color-intense); 
        }
      }
      
      .animate-pulse-subtle {
        animation: pulse-subtle 1.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Update the well rendering part with enhanced preview effects
  const renderWellContent = (row, col) => {
    const wellId = getWellId(row, col, rowLabels, colLabels);
    const wellStyles = getWellStyles(row, col);
    const hasLabels = wellStyles.labels && wellStyles.labels.length > 0;
    const isPreview = wellStyles.isPreview;

    // Calculate text size based on plate dimensions and screen size
    const getTextSizeClass = () => {
      // Base size on total wells (fewer wells = larger text)
      const totalWells = rows * cols;

      // Screen size detection using window width
      const screenWidth = window.innerWidth;

      // Determine base size class by plate density
      let baseSize = "";
      if (totalWells <= 24) {
        baseSize = "text-base"; // Larger text for plates with few wells (e.g., 6-well, 12-well, 24-well)
      } else if (totalWells <= 96) {
        baseSize = "text-sm"; // Medium text for 96-well plates
      } else {
        baseSize = "text-xs"; // Small text for 384-well plates or denser
      }

      // Adjust size based on screen width
      if (screenWidth < 640) {
        // Small mobile screens
        // Downgrade text size by one level on small screens
        if (baseSize === "text-base") return "text-sm";
        if (baseSize === "text-sm") return "text-xs";
        return "text-[0.65rem]"; // Smaller than xs for very dense plates on mobile
      } else if (screenWidth < 1024) {
        // Tablets and small laptops
        return baseSize; // Use base size
      } else {
        // Large screens
        // Upgrade text size by one level on large screens
        if (baseSize === "text-xs") return "text-sm";
        if (baseSize === "text-sm") return "text-base";
        return "text-lg"; // Larger than base for sparse plates on big screens
      }
    };

    return (
      <div
        data-well-id={wellId}
        className={`rounded-full cursor-pointer z-10 relative w-[calc(100%-6px)] h-[calc(100%-6px)] m-0.5 ${
          isWellSelected(row, col) ? "border-blue-500 dark:border-blue-400" : ""
        } ${
          wellStyles.borderColor === "transparent"
            ? ""
            : "border-1 lg:border-2"
        } ${
          isPreview
            ? "transition-all duration-200 animate-pulse-subtle hover:translate-y-[-1px]"
            : ""
        }`}
        style={{
          backgroundColor: wellStyles.backgroundColor,
          borderColor: wellStyles.borderColor,
          boxShadow: wellStyles.boxShadow,
          transform: isPreview ? "translateY(-1px)" : "none",
          // Use CSS variable for outline color
          outline: isPreview ? "2px solid var(--well-outline-color)" : "none",
          outlineOffset: "1px",
        }}
        onClick={(e) => handleWellClick(row, col, e)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu?.(e, "well");
        }}
      >
        {/* Well labels */}
        {hasLabels && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            {wellStyles.labels.map((label, index) => {
              // Determine text color based on background contrast
              let textColor = "#000000";

              // Check if the background is transparent
              const isTransparentBackground =
                wellStyles.backgroundColor === "transparent" ||
                wellStyles.backgroundColor ===
                  "var(--well-default-bg, #ffffff)";

              if (isTransparentBackground) {
                // For transparent background, check dark mode
                const isDarkMode =
                  document.documentElement.classList.contains("dark") ||
                  window.matchMedia("(prefers-color-scheme: dark)").matches;
                textColor = isDarkMode ? "#ffffff" : "#000000";
              } else {
                // For any non-transparent background, use contrast to determine text color
                // This ensures all label types get proper contrast regardless of label type
                textColor = tinycolor(wellStyles.backgroundColor).isDark()
                  ? "#ffffff"
                  : "#000000";
              }

              return (
                <div
                  key={index}
                  className={`${getTextSizeClass()} leading-tight overflow-hidden max-w-full px-0.5 whitespace-nowrap overflow-ellipsis`}
                  style={{ color: textColor }}
                >
                  {label.text}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Prepare a label for the selected element
  const selectedLabel = selectedElement
    ? selectedElement.type === "well"
      ? selectedElement.id
      : selectedElement.type === "row"
      ? `Row ${rowLabels[selectedElement.row]}`
      : `Col ${colLabels[selectedElement.col]}`
    : "None";

  // Common wrapper for all plate types
  const commonWrapper = (
    <div className="relative">
      {/* Plate label */}
      <div className="text-xs text-gray-500 dark:text-gray-400 absolute -top-6 left-2">
        {plateType} {id ? `#${id}` : ""}
      </div>

      {/* The plate container - no longer needs mouse/touch handlers */}
      <div
        ref={containerRef}
        className="relative border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 mb-4"
        style={{ width: "100%", aspectRatio: PLATE_RATIO }}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu?.(e, "plate");
        }}
      >
        {/* For well-type plates */}
        {type === "well" ? (
          <div className="absolute left-0 top-0 right-0 bottom-0 flex flex-col">
            {/* Column Labels */}
            <div className="flex h-6">
              <div className="w-6" />
              <div className="flex-1 flex">
                {colLabels.map((col, i) => (
                  <div
                    key={i}
                    data-col-index={i}
                    className={`flex-1 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-t-sm ${
                      isColumnSelected(i)
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                    onClick={(e) => handleColumnClick(i, e)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onContextMenu?.(e, "column");
                    }}
                  >
                    {col}
                  </div>
                ))}
              </div>
            </div>

            {/* Row labels + wells */}
            <div className="flex-1 flex">
              <div className="w-6 flex flex-col">
                {rowLabels.map((row, i) => (
                  <div
                    key={i}
                    data-row-index={i}
                    className={`flex-1 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-l-sm ${
                      isRowSelected(i)
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                    onClick={(e) => handleRowClick(i, e)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onContextMenu?.(e, "row");
                    }}
                  >
                    {row}
                  </div>
                ))}
              </div>
              <div
                className="flex-1 grid"
                style={{
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                }}
              >
                {Array.from({ length: rows * cols }).map((_, i) => {
                  const row = Math.floor(i / cols),
                    col = i % cols;
                  const wellId = getWellId(row, col, rowLabels, colLabels);
                  const wellStyles = getWellStyles(row, col);
                  return (
                    <div
                      key={`${row}-${col}`}
                      ref={(el) => (wellRefs.current[wellId] = el)}
                      data-well-container-id={wellId}
                      className="m-0 z-20 relative cursor-pointer"
                      style={{
                        backgroundColor: wellStyles.backgroundSquare,
                      }}
                    >
                      {renderWellContent(row, col)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Non-well types (dish, flask, chamber) - unchanged from original */
          <div
            className="absolute inset-0 flex items-center justify-center"
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu?.(e, type);
            }}
          >
            {type === "dish" && (
              <div className="w-3/4 h-3/4 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <span className="text-gray-700 dark:text-gray-300">
                  {plateType}
                </span>
              </div>
            )}
            {type === "flask" && (
              <div className="w-3/4 h-3/4 border border-gray-300 dark:border-gray-600 flex items-center">
                <div className="w-1/4 h-full bg-gray-100 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600" />
                <span className="text-gray-700 dark:text-gray-300 ml-4">
                  {plateType}
                </span>
              </div>
            )}
            {type === "chamber" && (
              <div
                className="w-3/4 h-3/4 border border-gray-300 dark:border-gray-600 grid"
                style={{
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                }}
              >
                {Array.from({ length: rows * cols }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-gray-300 dark:border-gray-600 flex items-center justify-center"
                  >
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dimensions display */}
      <div className="text-xs text-gray-500 dark:text-gray-400 absolute -bottom-6 left-2">
        {`Size: ${Math.round(dimensions.width)}×${Math.round(
          dimensions.height
        )}px`}
      </div>

      {/* Selected element display */}
      <div className="text-xs text-gray-500 dark:text-gray-400 absolute -bottom-6 right-2">
        {`Selected: ${selectedLabel}`}
      </div>
    </div>
  );

  // Use the common wrapper for rendering
  return commonWrapper;
};

export default PlateMap;
