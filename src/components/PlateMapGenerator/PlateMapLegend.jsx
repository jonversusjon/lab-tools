import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * SortableItem component for drag-and-drop
 */
const SortableItem = ({
  id,
  colorType,
  color,
  data,
  handleLegendItemChange,
  wellsByColor,
}) => {
  const [showWells, setShowWells] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get wells using this color
  const wellsWithColor = wellsByColor[colorType]?.[color] || [];
  const hasWells = wellsWithColor.length > 0;

  // Format well IDs for display (e.g., "A1, A2, B3, ...")
  const wellsDisplay = hasWells
    ? wellsWithColor.slice(0, 10).join(", ") +
      (wellsWithColor.length > 10
        ? `, +${wellsWithColor.length - 10} more`
        : "")
    : "No wells";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col bg-gray-50 dark:bg-gray-700 rounded-md overflow-hidden"
    >
      <div className="flex items-center gap-2 p-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-4 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
          </svg>
        </div>

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
              handleLegendItemChange(colorType, color, "label", e.target.value)
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

        {/* Wells info button */}
        {hasWells && (
          <button
            type="button"
            onClick={() => setShowWells(!showWells)}
            className="flex-shrink-0 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            title={showWells ? "Hide wells" : "Show wells using this color"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                d={
                  showWells
                    ? "M5.646 8.146a.5.5 0 0 1 .708 0L8 9.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708z"
                    : "M8 8a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 8zm0-2a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"
                }
              />
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8z" />
            </svg>
          </button>
        )}
      </div>

      {/* Wells using this color - collapsible section */}
      {showWells && hasWells && (
        <div className="text-xs p-2 pt-0 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600">
          <p className="font-medium mb-1">Wells with this color:</p>
          <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded max-h-20 overflow-y-auto">
            {wellsDisplay}
          </div>
        </div>
      )}
    </div>
  );
};

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

  // Track order of colors for each type
  const [colorOrder, setColorOrder] = useState({
    fillColor: [],
    borderColor: [],
    backgroundColor: [],
  });

  // Set up drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

    // Initialize or update color order
    const newColorOrder = {};
    Object.entries(extractedColors).forEach(([colorType, colors]) => {
      // Keep existing order if possible, add new colors at the end
      const existingOrder = colorOrder[colorType] || [];
      const currentColors = Object.keys(colors);

      // Filter out colors that no longer exist
      const filteredOrder = existingOrder.filter((color) =>
        currentColors.includes(color)
      );

      // Add new colors that aren't in the order yet
      const newColors = currentColors.filter(
        (color) => !filteredOrder.includes(color)
      );

      newColorOrder[colorType] = [...filteredOrder, ...newColors];
    });

    setColorOrder(newColorOrder);
  }, [wellData, legend.colors, colorTypeLabels, colorOrder]);

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

  // Handle drag end event for reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Find which color type this belongs to
    let targetColorType = null;
    for (const [colorType, colors] of Object.entries(colorOrder)) {
      if (colors.includes(active.id)) {
        targetColorType = colorType;
        break;
      }
    }

    if (!targetColorType) return;

    const oldIndex = colorOrder[targetColorType].indexOf(active.id);
    const newIndex = colorOrder[targetColorType].indexOf(over.id);

    setColorOrder({
      ...colorOrder,
      [targetColorType]: arrayMove(
        colorOrder[targetColorType],
        oldIndex,
        newIndex
      ),
    });
  };

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* Legend items by color type */}
        {Object.entries(usedColors).map(([colorType, colors]) => {
          if (Object.keys(colors).length === 0) return null;

          return (
            <div key={colorType} className="mb-4">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {colorTypeLabels[colorType]}
              </div>

              <SortableContext
                items={colorOrder[colorType]}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {colorOrder[colorType].map((color) => {
                    const data = colors[color];
                    if (!data) return null;

                    return (
                      <SortableItem
                        key={color}
                        id={color}
                        colorType={colorType}
                        color={color}
                        data={data}
                        handleLegendItemChange={handleLegendItemChange}
                        wellsByColor={wellsByColor}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </DndContext>
    </div>
  );
};

export default PlateMapLegend;
