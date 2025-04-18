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

// Color elements that can be styled
const COLOR_ELEMENTS = [
  { id: "fillColor", label: "Fill", icon: "🔵" },
  { id: "borderColor", label: "Border", icon: "◯" },
  { id: "backgroundColor", label: "Background", icon: "□" },
];

// Predefined color options
const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#6b7280", // Gray
  "#000000", // Black
];

const PlateMapControls = ({
  plateType,
  onPlateTypeChange,
  onSave,
  onClear,
  onDelete,
  onColorChange,
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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorElement, setActiveColorElement] = useState("fillColor");
  const [lastUsedColors, setLastUsedColors] = useState({
    fillColor: "#3b82f6",
    borderColor: "#000000",
    backgroundColor: "#f3f4f6",
  });

  const dropdownRef = useRef(null);
  const contextMenuRef = useRef(null);
  const colorPickerRef = useRef(null);
  const colorButtonsRef = useRef(null);

  // Handle outside clicks to close dropdowns and context menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }

      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target) &&
        colorButtonsRef.current &&
        !colorButtonsRef.current.contains(event.target)
      ) {
        setShowColorPicker(false);
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

  // Change the active color element (fill, border, background)
  const handleColorElementChange = useCallback((elementId) => {
    setActiveColorElement(elementId);
  }, []);

  // Handle color change from the color picker input
  const handleColorChange = useCallback(
    (event) => {
      const newColor = event.target.value;
      setLastUsedColors((prev) => ({
        ...prev,
        [activeColorElement]: newColor,
      }));

      // Only update if we have a color change handler
      if (onColorChange) {
        onColorChange(newColor, activeColorElement);
      }
    },
    [onColorChange, activeColorElement]
  );

  // Apply the selected preset color
  const handleApplyColor = useCallback(
    (presetColor = null) => {
      const colorToApply = presetColor || lastUsedColors[activeColorElement];

      // Update last used color for this element if a preset was provided
      if (presetColor) {
        setLastUsedColors((prev) => ({
          ...prev,
          [activeColorElement]: presetColor,
        }));
      }

      // Apply the color
      if (onColorChange) {
        onColorChange(colorToApply, activeColorElement);
      }

      // Close the color picker if a preset was clicked
      if (presetColor) {
        setShowColorPicker(false);
      }
    },
    [onColorChange, activeColorElement, lastUsedColors]
  );

  // Update context menu handlers to also close the menu via the prop
  const handleSetContextColor = useCallback(() => {
    onColorChange?.(lastUsedColors[activeColorElement], activeColorElement);
    onCloseContextMenu?.(); // Close menu
  }, [onColorChange, lastUsedColors, activeColorElement, onCloseContextMenu]);

  const handleClearContext = useCallback(() => {
    onClear?.();
    onCloseContextMenu?.(); // Close menu
  }, [onClear, onCloseContextMenu]);

  // Toggle the color picker visibility
  const toggleColorPicker = useCallback(() => {
    setShowColorPicker((prev) => !prev);
  }, []);

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

      {/* Enhanced Color Controls */}
      <div className="relative flex items-center gap-2">
        <div
          ref={colorButtonsRef}
          className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden"
        >
          {/* Color Element Selector Buttons */}
          {COLOR_ELEMENTS.map((elem) => (
            <button
              key={elem.id}
              onClick={() => handleColorElementChange(elem.id)}
              className={`px-2 py-1 border-r last:border-r-0 border-gray-300 dark:border-gray-600 text-sm ${
                activeColorElement === elem.id
                  ? "bg-gray-200 dark:bg-gray-600 font-medium"
                  : "bg-white dark:bg-gray-700"
              }`}
              title={`Set ${elem.label} Color`}
            >
              <span className="flex items-center gap-1">
                <span>{elem.icon}</span>
                <span className="hidden sm:inline">{elem.label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Current Color and Apply Button */}
        <div className="flex items-center">
          <button
            onClick={() => handleApplyColor()}
            className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-md hover:bg-gray-50 dark:hover:bg-gray-600"
            title="Apply current color"
          >
            <div
              className="w-4 h-4 rounded-sm border border-gray-400"
              style={{ backgroundColor: lastUsedColors[activeColorElement] }}
            />
            <span className="text-sm">Apply</span>
          </button>

          {/* Toggle Color Picker */}
          <button
            onClick={toggleColorPicker}
            className="px-2 py-1 bg-white dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-50 dark:hover:bg-gray-600"
            title="More colors"
          >
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
        </div>

        {/* Color Picker Flyout */}
        {showColorPicker && (
          <div
            ref={colorPickerRef}
            className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10"
          >
            {/* Color Picker Element */}
            <div className="mb-2">
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                {`${
                  COLOR_ELEMENTS.find((e) => e.id === activeColorElement)?.label
                } Color:`}
              </label>
              <input
                type="color"
                value={lastUsedColors[activeColorElement]}
                onChange={handleColorChange}
                className="w-full h-8 p-0.5 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
              />
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                Presets:
              </label>
              <div className="grid grid-cols-4 gap-1">
                {PRESET_COLORS.map((presetColor, index) => (
                  <button
                    key={index}
                    onClick={() => handleApplyColor(presetColor)}
                    className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
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
                  <div className="flex flex-col gap-1 px-3 py-1">
                    {COLOR_ELEMENTS.map((elem) => (
                      <button
                        key={elem.id}
                        className="w-full text-left px-2 py-1 text-sm flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                        onClick={() => {
                          setActiveColorElement(elem.id);
                          handleSetContextColor();
                        }}
                      >
                        <span>{elem.icon}</span>
                        <span>Set {elem.label.toLowerCase()} color</span>
                      </button>
                    ))}
                  </div>
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
                  <div className="flex flex-col gap-1 px-3 py-1">
                    {COLOR_ELEMENTS.map((elem) => (
                      <button
                        key={elem.id}
                        className="w-full text-left px-2 py-1 text-sm flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                        onClick={() => {
                          setActiveColorElement(elem.id);
                          handleSetContextColor();
                        }}
                      >
                        <span>{elem.icon}</span>
                        <span>Set row {elem.label.toLowerCase()} color</span>
                      </button>
                    ))}
                  </div>
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
                  <div className="flex flex-col gap-1 px-3 py-1">
                    {COLOR_ELEMENTS.map((elem) => (
                      <button
                        key={elem.id}
                        className="w-full text-left px-2 py-1 text-sm flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                        onClick={() => {
                          setActiveColorElement(elem.id);
                          handleSetContextColor();
                        }}
                      >
                        <span>{elem.icon}</span>
                        <span>Set column {elem.label.toLowerCase()} color</span>
                      </button>
                    ))}
                  </div>
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
