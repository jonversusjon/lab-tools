import { useState, useEffect, useRef } from "react";
import { PLATE_TYPES, PLATE_RATIO } from "./PlateTypes";

const PlateMap = ({
  plateType = "96-well",
  onWellClick,
  onRowClick,
  onColumnClick,
  selectedWells = [],
  wellData = {},
  id,
  onContextMenu,
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedElement, setSelectedElement] = useState(null);

  // Get plate configuration based on type
  const plateConfig = PLATE_TYPES[plateType] || PLATE_TYPES["96-well"];
  const { rows, cols, type } = plateConfig;

  // Generate row/column labels
  const rowLabels = Array.from({ length: rows }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  // Generate column labels (1, 2, 3, ...)

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

  // Handlers
  const handleWellClick = (row, col) => {
    const wellId = `${rowLabels[row]}${colLabels[col]}`;
    setSelectedElement({ type: "well", row, col, id: wellId });
    onWellClick?.(wellId, row, col);
  };

  // Handle row label click (select entire row)
  const handleRowClick = (row) => {
    setSelectedElement({ type: "row", row });
    if (onRowClick) {
      onRowClick(row, rowLabels[row]);
    }
  };

  // Handle column label click (select entire column)
  const handleColumnClick = (col) => {
    setSelectedElement({ type: "column", col });
    if (onColumnClick) {
      onColumnClick(col, colLabels[col]);
    }
  };

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

  // Get well color based on well data
  const getWellColor = (row, col) => {
    const wellId = `${rowLabels[row]}${colLabels[col]}`;
    return wellData[wellId]?.color || null;
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
    <div
      ref={containerRef}
      className="relative border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 mb-4"
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
                  className={`flex-1 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-t-sm ${
                    isColumnSelected(i)
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : ""
                  }`}
                  onClick={() => handleColumnClick(i)}
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
                  className={`flex-1 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-l-sm ${
                    isRowSelected(i)
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : ""
                  }`}
                  onClick={() => handleRowClick(i)}
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
                const isSelected = isWellSelected(row, col);
                const wellColor = getWellColor(row, col);
                return (
                  <div
                    key={`${row}-${col}`}
                    className={`m-0.5 rounded-full cursor-pointer border ${
                      isSelected
                        ? "border-blue-500 dark:border-blue-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    style={{
                      backgroundColor: wellColor || "transparent",
                      boxShadow: isSelected
                        ? "0 0 0 2px rgba(59, 130, 246, 0.4)"
                        : "none",
                    }}
                    onClick={() => handleWellClick(row, col)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onContextMenu?.(e, "well");
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Non-well types (dish, flask, chamber) */
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

      {/* Plate label */}
      <div className="absolute top-2 left-2 text-xs text-gray-500 dark:text-gray-400">
        {plateType} {id ? `#${id}` : ""}
      </div>

      {/* Dimensions display */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-500 dark:text-gray-400">
        {`Size: ${Math.round(dimensions.width)}×${Math.round(
          dimensions.height
        )}px`}
      </div>

      {/* Selected element display */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
        {`Selected: ${selectedLabel}`}
      </div>
    </div>
  );

  // Use the common wrapper for rendering
  return commonWrapper;
};

export default PlateMap;
