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

// New structured color palette: 9 hues with 11 intensity levels each
const COLOR_PALETTE = [
  // Slate
  [
    // "#f8fafc", // 50
    "#f1f5f9", // 100
    "#e2e8f0", // 200
    "#cbd5e1", // 300
    "#94a3b8", // 400
    "#64748b", // 500
    "#475569", // 600
    "#334155", // 700
    "#1e293b", // 800
    "#0f172a", // 900
    "#020617", // 950
  ],
  // Gray
  // [
  //   "#f9fafb", // 50
  //   "#f3f4f6", // 100
  //   "#e5e7eb", // 200
  //   "#d1d5db", // 300
  //   "#9ca3af", // 400
  //   "#6b7280", // 500
  //   "#4b5563", // 600
  //   "#374151", // 700
  //   "#1f2937", // 800
  //   "#111827", // 900
  //   "#030712", // 950
  // ],
  // Zinc
  // [
  //   "#fafafa", // 50
  //   "#f4f4f5", // 100
  //   "#e4e4e7", // 200
  //   "#d4d4d8", // 300
  //   "#a1a1aa", // 400
  //   "#71717a", // 500
  //   "#52525b", // 600
  //   "#3f3f46", // 700
  //   "#27272a", // 800
  //   "#18181b", // 900
  //   "#09090b", // 950
  // ],
  // Neutral
  // [
  //   "#fafafa", // 50
  //   "#f5f5f5", // 100
  //   "#e5e5e5", // 200
  //   "#d4d4d4", // 300
  //   "#a3a3a3", // 400
  //   "#737373", // 500
  //   "#525252", // 600
  //   "#404040", // 700
  //   "#262626", // 800
  //   "#171717", // 900
  //   "#0a0a0a", // 950
  // ],
  // Stone
  [
    // "#fafaf9", // 50
    "#f5f5f4", // 100
    "#e7e5e4", // 200
    "#d6d3d1", // 300
    "#a8a29e", // 400
    "#78716c", // 500
    "#57534e", // 600
    "#44403c", // 700
    "#292524", // 800
    "#1c1917", // 900
    "#0c0a09", // 950
  ],
  // Red
  [
    // "#fef2f2", // 50
    "#fee2e2", // 100
    "#fecaca", // 200
    "#fca5a5", // 300
    "#f87171", // 400
    "#ef4444", // 500
    "#dc2626", // 600
    "#b91c1c", // 700
    "#991b1b", // 800
    "#7f1d1d", // 900
    "#450a0a", // 950
  ],
  // Orange
  [
    // "#fff7ed", // 50
    "#ffedd5", // 100
    "#fed7aa", // 200
    "#fdba74", // 300
    "#fb923c", // 400
    "#f97316", // 500
    "#ea580c", // 600
    "#c2410c", // 700
    "#9a3412", // 800
    "#7c2d12", // 900
    "#431407", // 950
  ],
  // Amber
  [
    // "#fffbeb", // 50
    "#fef3c7", // 100
    "#fde68a", // 200
    "#fcd34d", // 300
    "#fbbf24", // 400
    "#f59e0b", // 500
    "#d97706", // 600
    "#b45309", // 700
    "#92400e", // 800
    "#78350f", // 900
    "#451a03", // 950
  ],
  // Yellow
  [
    // "#fefce8", // 50
    "#fef9c3", // 100
    "#fef08a", // 200
    "#fde047", // 300
    "#facc15", // 400
    "#eab308", // 500
    "#ca8a04", // 600
    "#a16207", // 700
    "#854d0e", // 800
    "#713f12", // 900
    "#422006", // 950
  ],
  // Lime
  [
    // "#f7fee7", // 50
    "#ecfccb", // 100
    "#d9f99d", // 200
    "#bef264", // 300
    "#a3e635", // 400
    "#84cc16", // 500
    "#65a30d", // 600
    "#4d7c0f", // 700
    "#3f6212", // 800
    "#365314", // 900
    "#1a2e05", // 950
  ],
  // Green
  [
    // "#f0fdf4", // 50
    "#dcfce7", // 100
    "#bbf7d0", // 200
    "#86efac", // 300
    "#4ade80", // 400
    "#22c55e", // 500
    "#16a34a", // 600
    "#15803d", // 700
    "#166534", // 800
    "#14532d", // 900
    "#052e16", // 950
  ],
  // Emerald
  [
    // "#ecfdf5", // 50
    "#d1fae5", // 100
    "#a7f3d0", // 200
    "#6ee7b7", // 300
    "#34d399", // 400
    "#10b981", // 500
    "#059669", // 600
    "#047857", // 700
    "#065f46", // 800
    "#064e3b", // 900
    "#022c22", // 950
  ],
  // Teal
  [
    // "#f0fdfa", // 50
    "#ccfbf1", // 100
    "#99f6e4", // 200
    "#5eead4", // 300
    "#2dd4bf", // 400
    "#14b8a6", // 500
    "#0d9488", // 600
    "#0f766e", // 700
    "#115e59", // 800
    "#134e4a", // 900
    "#042f2e", // 950
  ],
  // Cyan
  [
    // "#ecfeff", // 50
    "#cffafe", // 100
    "#a5f3fc", // 200
    "#67e8f9", // 300
    "#22d3ee", // 400
    "#06b6d4", // 500
    "#0891b2", // 600
    "#0e7490", // 700
    "#155e75", // 800
    "#164e63", // 900
    "#083344", // 950
  ],
  // Sky
  [
    // "#f0f9ff", // 50
    "#e0f2fe", // 100
    "#bae6fd", // 200
    "#7dd3fc", // 300
    "#38bdf8", // 400
    "#0ea5e9", // 500
    "#0284c7", // 600
    "#0369a1", // 700
    "#075985", // 800
    "#0c4a6e", // 900
    "#082f49", // 950
  ],
  // Blue
  [
    // "#eff6ff", // 50
    "#dbeafe", // 100
    "#bfdbfe", // 200
    "#93c5fd", // 300
    "#60a5fa", // 400
    "#3b82f6", // 500
    "#2563eb", // 600
    "#1d4ed8", // 700
    "#1e40af", // 800
    "#1e3a8a", // 900
    "#172554", // 950
  ],
  // Indigo
  [
    // "#eef2ff", // 50
    "#e0e7ff", // 100
    "#c7d2fe", // 200
    "#a5b4fc", // 300
    "#818cf8", // 400
    "#6366f1", // 500
    "#4f46e5", // 600
    "#4338ca", // 700
    "#3730a3", // 800
    "#312e81", // 900
    "#1e1b4b", // 950
  ],
  // Violet
  [
    // "#f5f3ff", // 50
    "#ede9fe", // 100
    "#ddd6fe", // 200
    "#c4b5fd", // 300
    "#a78bfa", // 400
    "#8b5cf6", // 500
    "#7c3aed", // 600
    "#6d28d9", // 700
    "#5b21b6", // 800
    "#4c1d95", // 900
    "#2e1065", // 950
  ],
  // Purple
  [
    // "#faf5ff", // 50
    "#f3e8ff", // 100
    "#e9d5ff", // 200
    "#d8b4fe", // 300
    "#c084fc", // 400
    "#a855f7", // 500
    "#9333ea", // 600
    "#7e22ce", // 700
    "#6b21a8", // 800
    "#581c87", // 900
    "#3b0764", // 950
  ],
  // Fuchsia
  [
    // "#fdf4ff", // 50
    "#fae8ff", // 100
    "#f5d0fe", // 200
    "#f0abfc", // 300
    "#e879f9", // 400
    "#d946ef", // 500
    "#c026d3", // 600
    "#a21caf", // 700
    "#86198f", // 800
    "#701a75", // 900
    "#4a044e", // 950
  ],
  // Pink
  [
    // "#fdf2f8", // 50
    "#fce7f3", // 100
    "#fbcfe8", // 200
    "#f9a8d4", // 300
    "#f472b6", // 400
    "#ec4899", // 500
    "#db2777", // 600
    "#be185d", // 700
    "#9d174d", // 800
    "#831843", // 900
    "#500724", // 950
  ],
  // Rose
  [
    // "#fff1f2", // 50
    "#ffe4e6", // 100
    "#fecdd3", // 200
    "#fda4af", // 300
    "#fb7185", // 400
    "#f43f5e", // 500
    "#e11d48", // 600
    "#be123c", // 700
    "#9f1239", // 800
    "#881337", // 900
    "#4c0519", // 950
  ],
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
  const [customPresets, setCustomPresets] = useState([]);
  const [editingPreset, setEditingPreset] = useState(null);
  // New state for expanded color palette
  const [isColorPaletteExpanded, setIsColorPaletteExpanded] = useState(false);

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

  // Change the active color element AND apply the color to the selection
  const handleColorElementChange = useCallback(
    (elementId) => {
      setActiveColorElement(elementId);

      // Apply the current color associated with this element to the selection
      if (onColorChange) {
        onColorChange(lastUsedColors[elementId], elementId);
        // Don't clear selection - let user apply multiple colors or keep selection
      }
      // Close any open color picker when applying via the main button
      closeColorPicker();
    },
    [onColorChange, lastUsedColors, closeColorPicker]
  );

  // Handle color change from the color picker input - only update UI state without applying color
  const handleColorChange = useCallback(
    (event) => {
      const newColor = event.target.value;
      setLastUsedColors((prev) => ({
        ...prev,
        [activeColorElement]: newColor,
      }));
      // No longer automatically applying the color when changed in the picker
    },
    [activeColorElement]
  );

  // Add this function with the other handlers in the component
  const handleClearContext = useCallback(() => {
    // Determine what to clear based on the contextMenuType
    if (contextMenuType === "plate") {
      // For plate context, clear selection
      onClear?.("selection");
    } else {
      // For well, row, or column context, just clear the selection
      onClear?.("selection");
    }

    // Close the context menu
    onCloseContextMenu?.();
  }, [onClear, onCloseContextMenu, contextMenuType]);

  // Apply the selected preset color or current color and clear selection afterwards
  const handleApplyColor = useCallback(
    (presetColor = null) => {
      // Handle "none" color - pass "transparent" as the actual color value
      // If presetColor is null, it means the "Apply" button *was* clicked (but now removed),
      // so we fall back to lastUsedColors. Now this primarily handles presets/"None".
      const colorToApply =
        presetColor === "none"
          ? "transparent"
          : presetColor || lastUsedColors[activeColorElement];

      // Update last used color for this element when a preset or "None" is applied
      if (presetColor !== null) {
        // Only update if a preset/None was explicitly passed
        setLastUsedColors((prev) => ({
          ...prev,
          [activeColorElement]: colorToApply,
        }));
      }

      // Apply the color
      if (onColorChange) {
        onColorChange(colorToApply, activeColorElement);

        // Clear selection after applying color
        onClear?.("selection");
      }

      // Close the color picker when a preset or "None" is clicked
      // (The main apply button click is handled in handleColorElementChange)
      if (presetColor !== null) {
        closeColorPicker();
      }
    },
    [
      onColorChange,
      activeColorElement,
      lastUsedColors,
      closeColorPicker,
      onClear,
    ]
  );

  // Update context menu handlers to also clear selection after applying color
  const handleSetContextColor = useCallback(() => {
    onColorChange?.(lastUsedColors[activeColorElement], activeColorElement);

    // Clear selection after applying color
    onClear?.("selection");

    onCloseContextMenu?.(); // Close menu
  }, [
    onColorChange,
    lastUsedColors,
    activeColorElement,
    onCloseContextMenu,
    onClear,
  ]);

  // New handler for removing color via context menu with selection clearing
  const handleRemoveColor = useCallback(() => {
    onColorChange?.("transparent", activeColorElement);

    // Clear selection after removing color
    onClear?.("selection");

    onCloseContextMenu?.(); // Close menu
  }, [onColorChange, activeColorElement, onCloseContextMenu, onClear]);

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

  // Toggle color palette expanded state
  const toggleColorPaletteExpanded = useCallback(() => {
    setIsColorPaletteExpanded((prev) => !prev);
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
          <div className="absolute left-0 mt-1 z-60 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden">
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
              {/* Split button design with color swatch and apply button */}
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
                  title={`Apply ${elem.label.toLowerCase()} color to selection`} // Updated title
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
                      value={
                        lastUsedColors[elem.id] === "transparent"
                          ? "#ffffff"
                          : lastUsedColors[elem.id]
                      }
                      onChange={handleColorChange}
                      className="w-full h-8 p-0.5 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                    />
                  </div>

                  {/* None option */}
                  <div className="mb-2">
                    <button
                      onClick={() => handleApplyColor("none")} // Use handleApplyColor again
                      className={`w-full px-2 py-1.5 text-sm border rounded-md flex items-center justify-center gap-2
                        ${
                          lastUsedColors[elem.id] === "transparent"
                            ? "bg-gray-100 dark:bg-gray-700 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                            : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                    >
                      <span className="bg-gray-200 dark:bg-gray-600 w-4 h-4 inline-block rounded-sm">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-4 h-4 text-gray-500 dark:text-gray-400"
                        >
                          <path
                            fill="currentColor"
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                          />
                        </svg>
                      </span>
                      <span>None (Transparent)</span>
                    </button>
                  </div>

                  {/* Default Color Presets - New UI */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm text-gray-600 dark:text-gray-300">
                        Default Presets:
                      </label>
                      <button
                        onClick={toggleColorPaletteExpanded}
                        className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        {isColorPaletteExpanded ? "Collapse" : "Expand"}
                      </button>
                    </div>

                    {/* Color Palette - hues from right to left, shades from top to bottom */}
                    <div className="flex justify-start gap-0">
                      {/* In collapsed view, show only 10 hues */}
                      {(isColorPaletteExpanded
                        ? COLOR_PALETTE
                        : COLOR_PALETTE.filter(
                            (_, idx) =>
                              [0, 2, 5, 7, 12, 15].includes(idx) // 10 selected hues
                          )
                      ).map((hueSet, hueIndex) => (
                        <div
                          key={`hue-${hueIndex}`}
                          className="flex flex-col gap-0"
                        >
                          {isColorPaletteExpanded
                            ? hueSet.map((colorHex, intensityIndex) => (
                                <button
                                  key={`color-${hueIndex}-${intensityIndex}`}
                                  onClick={() => handleApplyColor(colorHex)}
                                  className="w-4 h-4 rounded-none border-0 hover:z-10 hover:shadow-md transition-shadow cursor-pointer"
                                  style={{ backgroundColor: colorHex }}
                                  title={colorHex}
                                />
                              ))
                            : [0, 2, 4, 6, 8, 10].map((intensityIndex) => (
                                <button
                                  key={`color-${hueIndex}-${intensityIndex}`}
                                  onClick={() =>
                                    handleApplyColor(hueSet[intensityIndex])
                                  }
                                  className="w-6 h-6 rounded-none border-0 hover:z-10 hover:shadow-md transition-shadow cursor-pointer"
                                  style={{
                                    backgroundColor: hueSet[intensityIndex],
                                  }}
                                  title={hueSet[intensityIndex]}
                                />
                              ))}
                        </div>
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
                              onClick={() => handleApplyColor(presetColor)} // Use handleApplyColor again
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

        {/* Reset button - clears selection and colors without confirmation */}
        {onClear && (
          <button
            onClick={() => onClear("reset")}
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            title="Reset all well colors and clear selection (can be undone with Ctrl+Z)"
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
                    {/* Remove color options */}
                    {COLOR_ELEMENTS.map((elem) => (
                      <button
                        key={`remove-${elem.id}`}
                        className="w-full text-left px-2 py-1 text-sm flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                        onClick={() => {
                          setActiveColorElement(elem.id);
                          handleRemoveColor();
                        }}
                      >
                        <span>❌</span>
                        <span>Remove {elem.label.toLowerCase()} color</span>
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
                    {/* Remove color options */}
                    {COLOR_ELEMENTS.map((elem) => (
                      <button
                        key={`remove-${elem.id}`}
                        className="w-full text-left px-2 py-1 text-sm flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                        onClick={() => {
                          setActiveColorElement(elem.id);
                          handleRemoveColor();
                        }}
                      >
                        <span>❌</span>
                        <span>Remove row {elem.label.toLowerCase()} color</span>
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
                    {/* Remove color options */}
                    {COLOR_ELEMENTS.map((elem) => (
                      <button
                        key={`remove-${elem.id}`}
                        className="w-full text-left px-2 py-1 text-sm flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                        onClick={() => {
                          setActiveColorElement(elem.id);
                          handleRemoveColor();
                        }}
                      >
                        <span>❌</span>
                        <span>
                          Remove column {elem.label.toLowerCase()} color
                        </span>
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
                    onClick={handleClearContext}
                  >
                    Clear Selection
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      onClear?.("reset");
                      onCloseContextMenu?.();
                    }}
                  >
                    Reset Plate
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
