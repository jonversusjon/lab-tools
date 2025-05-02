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
  getWellsInRectangle,
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
  legend = { colors: {} }, // Add legend prop
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedElement, setSelectedElement] = useState(null);

  // Selection states
  const [selectionStart, setSelectionStart] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [wellPositions, setWellPositions] = useState({});
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

  // Calculate and store well positions for selection detection
  useEffect(() => {
    if (type === "well" && containerRef.current) {
      // Need to wait for the next render cycle to ensure wells are rendered
      const timer = setTimeout(() => {
        const positions = {};
        const containerRect = containerRef.current.getBoundingClientRect();

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const wellId = getWellId(row, col, rowLabels, colLabels);
            const wellElement = wellRefs.current[wellId];

            if (wellElement) {
              const rect = wellElement.getBoundingClientRect();
              positions[wellId] = {
                x: rect.left - containerRect.left,
                y: rect.top - containerRect.top,
                width: rect.width,
                height: rect.height,
              };
            }
          }
        }

        setWellPositions(positions);
      }, 100); // Short delay to ensure DOM is updated

      return () => clearTimeout(timer);
    }
  }, [dimensions, rows, cols, rowLabels, colLabels, type]);

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

  // Mouse down handler for drag selection
  const handleMouseDown = useCallback(
    (e) => {
      // Only act on left mouse button and within the plate area
      if (e.button !== 0 || type !== "well") return;

      // Check if the click is on a well, row label, or column label
      const isWellClick = e.target.dataset.wellId !== undefined;
      const isRowClick = e.target.dataset.rowIndex !== undefined;
      const isColClick = e.target.dataset.colIndex !== undefined;

      // Don't start rectangle selection if clicking directly on a well, row label, or column label
      if (isWellClick || isRowClick || isColClick) {
        return;
      }

      // Clear selection when clicking in non-functional areas of the plate
      // This makes it easy to start fresh selections
      if (onMultipleSelection) {
        onMultipleSelection([], false); // Empty array to clear selection
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const startX = e.clientX - containerRect.left;
      const startY = e.clientY - containerRect.top;

      // Store the starting point for the selection rectangle
      setSelectionStart({ x: startX, y: startY });
      setSelectionRect({ startX, startY, endX: startX, endY: startY });
      setIsSelecting(true);
    },
    [type, onMultipleSelection]
  );

  // Mouse move handler for drag selection
  const handleMouseMove = useCallback(
    (e) => {
      if (!isSelecting || type !== "well" || !selectionStart) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const currentX = Math.max(
        0,
        Math.min(e.clientX - containerRect.left, containerRect.width)
      );
      const currentY = Math.max(
        0,
        Math.min(e.clientY - containerRect.top, containerRect.height)
      );

      // Update the end point of the selection rectangle
      setSelectionRect((prev) => ({
        ...prev,
        endX: currentX,
        endY: currentY,
      }));
    },
    [isSelecting, type, selectionStart]
  );

  // Mouse up handler for drag selection - calculate the wells in the selection
  const handleMouseUp = useCallback(
    (e) => {
      if (!isSelecting || type !== "well" || !selectionStart) {
        setIsSelecting(false);
        return;
      }

      // Calculate wells inside the selection rectangle
      if (selectionRect && Object.keys(wellPositions).length > 0) {
        const selectedRegion = getWellsInRectangle(
          selectionRect,
          wellPositions
        );

        // Check for modifier keys to determine the selection behavior
        const isToggleMode = e.ctrlKey || e.metaKey;

        // Trigger selection update with the wells in the region
        if (selectedRegion.length > 0 && onMultipleSelection) {
          // If ctrl/cmd is pressed, toggle the selection instead of replacing it
          if (isToggleMode) {
            onMultipleSelection(selectedRegion, true); // Pass true to indicate toggle mode
          } else {
            onMultipleSelection(selectedRegion);
          }
        }
      }

      // Reset selection state
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionRect(null);
    },
    [
      isSelecting,
      selectionRect,
      wellPositions,
      onMultipleSelection,
      type,
      selectionStart,
    ]
  );

  // Touch handlers for mobile devices
  const handleTouchStart = useCallback(
    (e) => {
      if (type !== "well") return;

      // Don't prevent default for all touch starts to allow scrolling
      // Only prevent for touches within the plate area
      const target = e.target;
      const isWellElement = target.dataset.wellId !== undefined;
      const isRowElement = target.dataset.rowIndex !== undefined;
      const isColElement = target.dataset.colIndex !== undefined;

      // Return early if the touch is on a well, row or column element
      // as those have their own click handlers
      if (isWellElement || isRowElement || isColElement) {
        return;
      }

      // Prevent default to avoid scrolling when starting selection
      e.preventDefault();

      const touch = e.touches[0];
      const containerRect = containerRef.current.getBoundingClientRect();
      const startX = touch.clientX - containerRect.left;
      const startY = touch.clientY - containerRect.top;

      // Store the starting point for the touch selection
      setSelectionStart({ x: startX, y: startY });
      setSelectionRect({ startX, startY, endX: startX, endY: startY });
      setIsSelecting(true);
    },
    [type]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isSelecting || type !== "well" || !selectionStart) return;

      // Prevent default to stop scrolling while selecting
      e.preventDefault();

      const touch = e.touches[0];
      const containerRect = containerRef.current.getBoundingClientRect();
      const currentX = Math.max(
        0,
        Math.min(touch.clientX - containerRect.left, containerRect.width)
      );
      const currentY = Math.max(
        0,
        Math.min(touch.clientY - containerRect.top, containerRect.height)
      );

      // Update the end point of the touch selection rectangle
      setSelectionRect((prev) => ({
        ...prev,
        endX: currentX,
        endY: currentY,
      }));
    },
    [isSelecting, type, selectionStart]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      // Prevent default to avoid accidental clicks
      if (e && e.cancelable) {
        e.preventDefault();
      }

      if (!isSelecting || type !== "well" || !selectionStart) {
        setIsSelecting(false);
        return;
      }

      // Calculate wells inside the touch selection rectangle
      if (selectionRect && Object.keys(wellPositions).length > 0) {
        const selectedRegion = getWellsInRectangle(
          selectionRect,
          wellPositions
        );

        // Get touches info for logging or future features
        const touchCount = e && e.touches ? e.touches.length : 0;
        const touchIdentifier =
          e && e.changedTouches && e.changedTouches[0]
            ? e.changedTouches[0].identifier
            : null;

        // Log touch information for debugging
        console.log(
          `Touch ended: ${touchCount} touches, identifier: ${touchIdentifier}`
        );

        // Use touch info to potentially modify selection behavior
        const isSingleTouch = touchCount <= 1;
        const hasIdentifier = touchIdentifier !== null;

        // Trigger selection update with the wells in the region
        if (selectedRegion.length > 0 && onMultipleSelection) {
          // Pass additional info about the touch that could be used by parent component
          onMultipleSelection(selectedRegion, isSingleTouch && hasIdentifier);
        }
      }

      // Reset selection state
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionRect(null);
    },
    [
      isSelecting,
      selectionRect,
      wellPositions,
      onMultipleSelection,
      type,
      selectionStart,
    ]
  );

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
          // Add to existing selection instead of replacing
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

    return {
      backgroundColor:
        data.fillColor === "transparent"
          ? "transparent"
          : data.fillColor || "transparent",
      borderColor:
        data.borderColor === "transparent"
          ? "transparent"
          : data.borderColor ||
            (selectedWells.includes(wellId)
              ? "rgba(59, 130, 246, 1)"
              : "rgba(209, 213, 219, 1)"),
      boxShadow: selectedWells.includes(wellId)
        ? "0 0 0 2px rgba(59, 130, 246, 0.4)"
        : "none",
      // Add background div style if needed
      backgroundSquare:
        data.backgroundColor === "transparent"
          ? "transparent"
          : data.backgroundColor || "transparent",
      labels: labels, // Add the collected labels
    };
  };

  // Update the well rendering part to include labels
  const renderWellContent = (row, col) => {
    const wellStyles = getWellStyles(row, col);
    const hasLabels = wellStyles.labels && wellStyles.labels.length > 0;

    return (
      <>
        {/* Background square */}
        {wellStyles.backgroundSquare !== "transparent" && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: wellStyles.backgroundSquare,
              zIndex: 0,
            }}
          />
        )}
        {/* The actual well */}
        <div
          className={`rounded-full cursor-pointer z-10 relative w-full h-full ${
            isWellSelected(row, col)
              ? "border-blue-500 dark:border-blue-400"
              : ""
          } ${
            wellStyles.borderColor === "transparent"
              ? ""
              : "border-2 md:border-3 lg:border-4"
          }`}
          style={{
            backgroundColor: wellStyles.backgroundColor,
            borderColor: wellStyles.borderColor,
            boxShadow: wellStyles.boxShadow,
          }}
          onClick={(e) => handleWellClick(row, col, e)}
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenu?.(e, "well");
          }}
        >
          {/* Well labels */}
          {hasLabels && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {wellStyles.labels.map((label, index) => {
                // Determine text color based on background contrast
                let textColor = "#000000";
                if (
                  label.type === "fillColor" &&
                  label.color !== "transparent"
                ) {
                  // For fill color, check if background is dark and set text to white
                  textColor = tinycolor(label.color).isDark()
                    ? "#ffffff"
                    : "#000000";
                }

                return (
                  <div
                    key={index}
                    className="text-[0.5rem] leading-tight overflow-hidden max-w-full px-0.5 whitespace-nowrap overflow-ellipsis"
                    style={{ color: textColor }}
                  >
                    {label.text}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
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
      {/* Plate label - MOVED OUTSIDE */}
      <div className="text-xs text-gray-500 dark:text-gray-400 absolute -top-6 left-2">
        {plateType} {id ? `#${id}` : ""}
      </div>

      {/* The plate container */}
      <div
        ref={containerRef}
        className="relative border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 mb-4"
        style={{ width: "100%", aspectRatio: PLATE_RATIO }}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu?.(e, "plate");
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
                  return (
                    <div
                      key={`${row}-${col}`}
                      ref={(el) => (wellRefs.current[wellId] = el)}
                      data-well-id={wellId}
                      className="m-0.5 relative"
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

        {/* Selection rectangle overlay */}
        {isSelecting && selectionRect && (
          <div
            className="absolute pointer-events-none border-2 border-dashed border-blue-500 bg-blue-500/10"
            style={{
              left: Math.min(selectionRect.startX, selectionRect.endX) + "px",
              top: Math.min(selectionRect.startY, selectionRect.endY) + "px",
              width: Math.abs(selectionRect.endX - selectionRect.startX) + "px",
              height:
                Math.abs(selectionRect.endY - selectionRect.startY) + "px",
              zIndex: 5,
            }}
          />
        )}
      </div>

      {/* Dimensions display - MOVED OUTSIDE */}
      <div className="text-xs text-gray-500 dark:text-gray-400 absolute -bottom-6 left-2">
        {`Size: ${Math.round(dimensions.width)}×${Math.round(
          dimensions.height
        )}px`}
      </div>

      {/* Selected element display - MOVED OUTSIDE */}
      <div className="text-xs text-gray-500 dark:text-gray-400 absolute -bottom-6 right-2">
        {`Selected: ${selectedLabel}`}
      </div>
    </div>
  );

  // Use the common wrapper for rendering
  return commonWrapper;
};

export default PlateMap;
