import { useState, useEffect, useRef, useCallback } from "react";
import { PLATE_TYPES } from "./PlateTypes";

// Group plate types by category for the dropdown menu
const PLATE_CATEGORIES = {
  "Well Plates": [
    "384-well",
    "96-well",
    "48-well",
    "24-well",
    "12-well",
    "6-well",
  ],
  "Culture Dishes": ["10cm", "15cm"],
  Flasks: ["T25", "T75", "T175", "T225"],
  "Chamber Slides": [
    "1-chamber",
    "2-chamber",
    "4-chamber",
    "8-chamber",
    "16-chamber",
  ],
};

const PlateMapControls = ({
  plateType,
  onPlateTypeChange,
  onSave,
  onClear,
  onDelete,
  onColorChange,
  color = "#3b82f6", // Default blue color
  selectedElements = [],
  contextMenuItems = [], // Additional context menu items
  plateId, // Prop is received
  isNew = false, // Flag for newly created plates
  // Receive context menu props from parent
  showContextMenu,
  contextMenuPosition,
  contextMenuType,
  onCloseContextMenu,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  // Remove local context menu state if controlled by parent
  // const [showContextMenu, setShowContextMenu] = useState(false);
  // const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  // const [contextMenuType, setContextMenuType] = useState(null);

  const dropdownRef = useRef(null);
  const contextMenuRef = useRef(null);
  const colorPickerRef = useRef(null);

  // Handle outside clicks to close dropdowns and context menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }

      // Close context menu on outside click
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target) &&
        (!colorPickerRef.current ||
          !colorPickerRef.current.contains(event.target))
      ) {
        // Use the callback passed from the parent
        onCloseContextMenu?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCloseContextMenu]); // Add onCloseContextMenu to dependency array

  // Handle plate type change
  const handlePlateTypeChange = useCallback(
    (type) => {
      onPlateTypeChange?.(type);
      setShowDropdown(false);
    },
    [onPlateTypeChange]
  );

  // Handle color change
  const handleColorChange = useCallback(
    (event) => {
      onColorChange?.(event.target.value);
    },
    [onColorChange]
  );

  // Update context menu handlers to also close the menu via the prop
  const handleSetContextColor = useCallback(() => {
    onColorChange?.(color);
    onCloseContextMenu?.(); // Close menu
  }, [onColorChange, color, onCloseContextMenu]);

  const handleClearContext = useCallback(() => {
    onClear?.();
    onCloseContextMenu?.(); // Close menu
  }, [onClear, onCloseContextMenu]);

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      {/* Plate Type Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <span>{plateType}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute left-0 mt-1 z-10 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto py-1">
              {Object.entries(PLATE_CATEGORIES).map(([category, types]) => (
                <div key={category}>
                  <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {category}
                  </div>
                  <div className="py-1">
                    {types.map((type) => (
                      <button
                        key={type}
                        onClick={() => handlePlateTypeChange(type)}
                        className={`w-full text-left px-4 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                          plateType === type
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700 dark:text-gray-300">
          Color:
        </label>
        <input
          ref={colorPickerRef}
          type="color"
          value={color}
          onChange={handleColorChange}
          className="w-8 h-8 p-0.5 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 items-center flex-wrap">
        {onSave && (
          <button
            onClick={onSave}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            title="Save changes to this plate"
          >
            Save
          </button>
        )}

        {/* New Clear Selection button - only clears selection state */}
        {onClear && (
          <button
            onClick={() => onClear("selection")}
            className="px-3 py-1.5 text-sm bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors"
            title="Clear current selection without changing colors"
          >
            Clear Selection
          </button>
        )}

        {/* Renamed Reset button - clears selection and colors */}
        {onClear && (
          <button
            onClick={() => onClear("reset")}
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            title="Reset all well colors and clear selection"
          >
            Reset Plate
          </button>
        )}

        {onDelete && !isNew && (
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            title="Delete this plate"
          >
            Delete
          </button>
        )}

        {/* Display Plate ID if it exists */}
        {plateId && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            (ID: {plateId})
          </span>
        )}
      </div>

      {/* Context Menu for selections - Use props from parent */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden p-1"
          style={{
            left: contextMenuPosition.x + "px",
            top: contextMenuPosition.y + "px",
            maxWidth: "200px",
          }}
        >
          {selectedElements.length > 0 && (
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
              {selectedElements.length === 1 ? (
                <span>Well {selectedElements[0]}</span>
              ) : (
                <span>{selectedElements.length} wells selected</span>
              )}
            </div>
          )}

          {contextMenuType && (
            <div className="py-1">
              {contextMenuType === "well" && (
                <>
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleSetContextColor}
                  >
                    Set color
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleClearContext}
                  >
                    Clear well
                  </button>
                </>
              )}

              {contextMenuType === "row" && (
                <>
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleSetContextColor}
                  >
                    Set row color
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleClearContext}
                  >
                    Clear row
                  </button>
                </>
              )}

              {contextMenuType === "column" && (
                <>
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleSetContextColor}
                  >
                    Set column color
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleClearContext}
                  >
                    Clear column
                  </button>
                </>
              )}

              {contextMenuType === "plate" && (
                <>
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleClearContext} // Use handleClearContext for reset for now
                  >
                    Reset plate
                  </button>
                </>
              )}
            </div>
          )}

          {/* Custom context menu items */}
          {contextMenuItems.length > 0 && (
            <div className="py-1 border-t border-gray-200 dark:border-gray-700">
              {contextMenuItems.map((item, index) => (
                <button
                  key={`ctx-item-${index}`}
                  onClick={item.onClick}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlateMapControls;
