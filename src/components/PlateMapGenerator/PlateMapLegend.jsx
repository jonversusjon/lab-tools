import React, { useState, useEffect, useCallback } from "react";

/**
 * PlateMapLegend component
 * Displays colors used in the plate and allows associating labels with them
 */
const PlateMapLegend = ({
  wellData = {},
  onLegendChange,
  legend = { colors: {} },
}) => {
  // Track colors used in the plate
  const [usedColors, setUsedColors] = useState({
    fillColor: {},
    borderColor: {},
    backgroundColor: {},
  });

  // Track which wells use each color (by colorType and color)
  const [wellsByColor, setWellsByColor] = useState({
    fillColor: {},
    borderColor: {},
    backgroundColor: {},
  });

  // Human-readable names for color types
  const colorTypeLabels = React.useMemo(
    () => ({
      fillColor: "Well Fill",
      borderColor: "Well Border",
      backgroundColor: "Well Background",
    }),
    []
  );

  // Update tracked colors whenever wellData changes
  useEffect(() => {
    // Extract all unique colors from wellData
    const extractedColors = {
      fillColor: {},
      borderColor: {},
      backgroundColor: {},
    };

    // Track wells by color
    const newWellsByColor = {
      fillColor: {},
      borderColor: {},
      backgroundColor: {},
    };

    // Process all wells to find unique colors
    Object.entries(wellData).forEach(([wellId, data]) => {
      if (!data) return;

      // Check each color type
      Object.entries(colorTypeLabels).forEach(([colorType]) => {
        const color = data[colorType];
        // Only track non-transparent, valid colors
        if (color && color !== "transparent") {
          extractedColors[colorType][color] = true;

          // Initialize array for this color if it doesn't exist
          if (!newWellsByColor[colorType][color]) {
            newWellsByColor[colorType][color] = [];
          }

          // Add the wellId to the array of wells with this color
          newWellsByColor[colorType][color].push(wellId);
        }
      });
    });

    // Get legend data for each color
    Object.entries(extractedColors).forEach(([colorType, colors]) => {
      Object.keys(colors).forEach((color) => {
        // Initialize with existing legend data or defaults
        const legendColors = legend.colors[colorType] || {};
        extractedColors[colorType][color] = legendColors[color] || {
          label: "",
          applyToWells: false,
          wells: newWellsByColor[colorType][color] || [],
        };
      });
    });

    setUsedColors(extractedColors);
    setWellsByColor(newWellsByColor);
  }, [wellData, legend.colors, colorTypeLabels]);

  // Update legend when a label or checkbox changes
  const handleLegendItemChange = useCallback(
    (colorType, color, field, value) => {
      const updatedColors = { ...usedColors };

      if (!updatedColors[colorType][color]) {
        updatedColors[colorType][color] = {
          label: "",
          applyToWells: false,
          wells: wellsByColor[colorType][color] || [],
        };
      }

      updatedColors[colorType][color] = {
        ...updatedColors[colorType][color],
        [field]: value,
      };

      setUsedColors(updatedColors);

      // Notify parent of legend changes
      if (onLegendChange) {
        const newLegend = {
          colors: {
            ...legend.colors,
            [colorType]: {
              ...(legend.colors[colorType] || {}),
              [color]: {
                ...updatedColors[colorType][color],
                wells: wellsByColor[colorType][color] || [],
              },
            },
          },
        };
        onLegendChange(newLegend);
      }
    },
    [usedColors, onLegendChange, legend.colors, wellsByColor]
  );

  // Count how many colors are defined across all types
  const colorCount = Object.values(usedColors).reduce(
    (count, colorGroup) => count + Object.keys(colorGroup).length,
    0
  );

  // If no colors are used, don't render anything
  if (colorCount === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic p-2">
        No colors used yet. Add colors to wells to create legend items.
      </div>
    );
  }

  return (
    <div className="plate-map-legend">
      <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
        Legend
      </h3>

      {/* Legend items by color type */}
      {Object.entries(usedColors).map(([colorType, colors]) => {
        if (Object.keys(colors).length === 0) return null;

        return (
          <div key={colorType} className="mb-4">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {colorTypeLabels[colorType]}
            </div>

            <div className="space-y-2">
              {Object.entries(colors).map(([color, data]) => (
                <div
                  key={`${colorType}-${color}`}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  {/* Color swatch */}
                  <div
                    className="w-6 h-6 rounded-md border border-gray-300 dark:border-gray-600 flex-shrink-0"
                    style={{
                      backgroundColor: color,
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                    }}
                  />

                  {/* Label input field */}
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={data.label || ""}
                      onChange={(e) =>
                        handleLegendItemChange(
                          colorType,
                          color,
                          "label",
                          e.target.value
                        )
                      }
                      placeholder="Enter label (1-2 words)"
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      maxLength={30}
                    />
                  </div>

                  {/* Checkbox to apply label to wells */}
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      id={`apply-${colorType}-${color}`}
                      checked={data.applyToWells || false}
                      onChange={(e) =>
                        handleLegendItemChange(
                          colorType,
                          color,
                          "applyToWells",
                          e.target.checked
                        )
                      }
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                    <label
                      htmlFor={`apply-${colorType}-${color}`}
                      className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer"
                    >
                      Show
                    </label>
                  </div>

                  {/* Color code display */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {color}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlateMapLegend;
