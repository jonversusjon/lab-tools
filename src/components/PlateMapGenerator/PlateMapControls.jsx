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
  { id: "fillColor", label: "Well", icon: "🔵" },
  { id: "borderColor", label: "Border", icon: "◯" },
  { id: "backgroundColor", label: "Background", icon: "□" },
];

// Default predefined color options
const DEFAULT_PRESET_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#6b7280", // Gray
  "#000000", // Black
];

// LocalStorage key for custom presets
const CUSTOM_PRESETS_STORAGE_KEY = "protocalc_custom_color_presets";

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
  const [activeColorElement, setActiveColorElement] = useState("fillColor");
  const [lastUsedColors, setLastUsedColors] = useState({
    fillColor: "#3b82f6",
    borderColor: "#000000",
    backgroundColor: "#f3f4f6",
  });
  const [activeColorPickerElement, setActiveColorPickerElement] =
    useState(null);
  // Add state for custom presets
  const [customPresets, setCustomPresets] = useState([]);
  const [editingPreset, setEditingPreset] = useState(null); // For tracking which preset is being edited

  // Add a ref to track color picker instances
  const colorPickerRefs = useRef({});
  const dropdownRef = useRef(null);
  const contextMenuRef = useRef(null);
  const colorButtonsRef = useRef(null);
  const customColorInputRef = useRef(null);

  // Load custom presets from localStorage
  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
      if (savedPresets) {
        setCustomPresets(JSON.parse(savedPresets));
      }
    } catch (error) {
      console.error("Error loading custom color presets:", error);
    }
  }, []);

  // Save custom presets to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(
        CUSTOM_PRESETS_STORAGE_KEY,
        JSON.stringify(customPresets)
      );
    } catch (error) {
      console.error("Error saving custom color presets:", error);
    }
  }, [customPresets]);

  // Define closeColorPicker before it's used in useEffect dependencies
  const closeColorPicker = useCallback(() => {
    setActiveColorPickerElement(null);
  }, []);

  // Handle outside clicks to close dropdowns and context menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }

      // Improved check for color picker clicks
      if (
        activeColorPickerElement &&
        colorPickerRefs.current[activeColorPickerElement] &&
        !colorPickerRefs.current[activeColorPickerElement].contains(
          event.target
        ) &&
        !event.target.closest(".color-swatch")
      ) {
        closeColorPicker();
      }

      // Close context menu on outside click
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target) &&
        (!activeColorPickerElement ||
          !colorPickerRefs.current[activeColorPickerElement] ||
          !colorPickerRefs.current[activeColorPickerElement].contains(
            event.target
          ))
      ) {
        // Use the callback passed from the parent
        onCloseContextMenu?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCloseContextMenu, activeColorPickerElement, closeColorPicker]);

  // Handle plate type change
  const handlePlateTypeChange = useCallback(
    (type) => {
      onPlateTypeChange?.(type);
      setShowDropdown(false);
    },
    [onPlateTypeChange]
  );

  // Change the active color element and apply the color immediately
  const handleColorElementChange = useCallback(
    (elementId) => {
      setActiveColorElement(elementId);

      // Apply the color immediately
      if (onColorChange) {
        onColorChange(lastUsedColors[elementId], elementId);
      }
    },
    [onColorChange, lastUsedColors]
  );

  // Handle color change from the color picker input - only update UI state without applying color
  const handleColorChange = useCallback(
    (event) => {
      const newColor = event.target.value;
      setLastUsedColors((prev) => ({
        ...prev,
        [activeColorElement]: newColor,
      }));

      // Remove the color application logic - color is now only updated in the UI
      // The user must explicitly click the apply button to apply the color
    },
    [activeColorElement]
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
        closeColorPicker();
      }
    },
    [onColorChange, activeColorElement, lastUsedColors, closeColorPicker]
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

  // Toggle the color picker visibility without applying color
  const toggleColorPicker = useCallback(
    (elementId = null) => {
      // If an element ID is provided, use it, otherwise use the current active element
      const targetElement = elementId || activeColorElement;

      // Toggle the color picker for the target element
      setActiveColorPickerElement((prev) =>
        prev === targetElement ? null : targetElement
      );

      // Also set this as the active color element if it's not already
      if (targetElement !== activeColorElement) {
        setActiveColorElement(targetElement);
      }
    },
    [activeColorElement]
  );

  // Toggle color picker for a specific element (used by color swatch click)
  const toggleColorPickerForElement = useCallback(
    (elementId, event) => {
      event.stopPropagation(); // Prevent triggering the parent button click
      toggleColorPicker(elementId);
    },
    [toggleColorPicker]
  );

  // Set color picker ref for the current element
  const setColorPickerRef = useCallback((element, ref) => {
    if (ref) {
      colorPickerRefs.current[element] = ref;
    }
  }, []);

  // Add a new custom preset
  const addCustomPreset = useCallback(
    (color) => {
      // Don't add duplicate colors
      if (!customPresets.includes(color)) {
        setCustomPresets((prev) => [...prev, color]);
      }
    },
    [customPresets]
  );

  // Remove a custom preset
  const removeCustomPreset = useCallback((colorToRemove) => {
    setCustomPresets((prev) => prev.filter((color) => color !== colorToRemove));
  }, []);

  // Start editing a custom preset
  const startEditPreset = useCallback((color) => {
    setEditingPreset(color);
  }, []);

  // Update a preset color
  const updatePresetColor = useCallback(
    (oldColor, newColor) => {
      if (oldColor === editingPreset) {
        setCustomPresets((prev) =>
          prev.map((color) => (color === oldColor ? newColor : color))
        );
        setEditingPreset(null);
      }
    },
    [editingPreset]
  );

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

      {/* Enhanced Color Controls - Split Buttons Design */}
      <div className="relative flex items-center gap-2">
        {/* Color Element Split Buttons - each with color picker and apply functionality */}
        <div ref={colorButtonsRef} className="flex items-center gap-1">
          {COLOR_ELEMENTS.map((elem) => (
            <div key={elem.id} className="relative flex">
              {/* Split button design - left side is color swatch, right side is apply button */}
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                {/* Left side - color swatch that opens color picker */}
                <button
                  className={`px-2 py-1.5 flex items-center justify-center ${
                    activeColorElement === elem.id
                      ? "bg-gray-100 dark:bg-gray-600"
                      : "bg-white dark:bg-gray-700"
                  }`}
                  onClick={(e) => toggleColorPickerForElement(elem.id, e)}
                  title={`Select ${elem.label.toLowerCase()} color`}
                >
                  <div
                    className="w-5 h-5 rounded-sm border border-gray-400 shadow-sm"
                    style={{ backgroundColor: lastUsedColors[elem.id] }}
                  />
                </button>

                {/* Right side - labeled button that applies the color */}
                <button
                  onClick={() => handleColorElementChange(elem.id)}
                  className={`px-2 py-1 text-sm border-l border-gray-300 dark:border-gray-600 ${
                    activeColorElement === elem.id
                      ? "bg-gray-100 dark:bg-gray-600 font-medium"
                      : "bg-white dark:bg-gray-700"
                  }`}
                  title={`Apply ${elem.label.toLowerCase()} color`}
                >
                  <span className="inline-block min-w-14">{elem.label}</span>
                </button>
              </div>

              {/* Color Picker Flyout for this element */}
              {activeColorPickerElement === elem.id && (
                <div
                  ref={(ref) => setColorPickerRef(elem.id, ref)}
                  className="absolute left-0 top-full mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50"
                  style={{ minWidth: "250px" }}
                >
                  {/* Color Picker Element */}
                  <div className="mb-2">
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {`${elem.label} Color:`}
                    </label>
                    <input
                      type="color"
                      value={lastUsedColors[elem.id]}
                      onChange={handleColorChange}
                      className="w-full h-8 p-0.5 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                    />
                  </div>

                  {/* Default Color Presets */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Default Presets:
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {DEFAULT_PRESET_COLORS.map((presetColor, index) => (
                        <button
                          key={`default-${index}`}
                          onClick={() => handleApplyColor(presetColor)}
                          className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                          style={{ backgroundColor: presetColor }}
                          title={presetColor}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Custom Color Presets with Management */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm text-gray-600 dark:text-gray-300">
                        Custom Presets:
                      </label>

                      {/* Add to presets button */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            addCustomPreset(lastUsedColors[elem.id])
                          }
                          className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
                          title="Add current color to presets"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    {/* Custom presets grid */}
                    {customPresets.length > 0 ? (
                      <div className="grid grid-cols-4 gap-1 mb-1">
                        {customPresets.map((presetColor, index) => (
                          <div
                            key={`custom-${index}`}
                            className="relative group"
                          >
                            {/* If currently editing this preset, show color input */}
                            {editingPreset === presetColor ? (
                              <input
                                type="color"
                                defaultValue={presetColor}
                                ref={customColorInputRef}
                                onChange={(e) =>
                                  updatePresetColor(presetColor, e.target.value)
                                }
                                onBlur={(e) =>
                                  updatePresetColor(presetColor, e.target.value)
                                }
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                autoFocus
                              />
                            ) : null}

                            {/* Color swatch button with overlay controls */}
                            <button
                              onClick={() => handleApplyColor(presetColor)}
                              className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                              style={{ backgroundColor: presetColor }}
                              title={`Use ${presetColor}`}
                            />

                            {/* Overlay controls (edit/delete) */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-0.5 rounded-md transition-opacity">
                              {/* Edit button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditPreset(presetColor);
                                }}
                                className="text-white p-1 hover:bg-white hover:bg-opacity-20 rounded"
                                title="Edit color"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  />
                                </svg>
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustomPreset(presetColor);
                                }}
                                className="text-white p-1 hover:bg-white hover:bg-opacity-20 rounded"
                                title="Remove color"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">
                        No custom presets yet. Add colors by clicking the "Add"
                        button.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
