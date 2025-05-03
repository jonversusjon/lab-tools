import { useState, useCallback, useRef, useEffect } from "react";
import PlateMap from "./PlateMap";
import { PLATE_TYPES } from "./PlateTypes";
import PlateMapControls from "./PlateMapControls";
import PlateMapLegend from "./PlateMapLegend";
import { getWellsInRectangle } from "../../utils";

// Separate wrapper component to isolate PlateMap rendering
const PlateMapWrapper = ({
  plateType,
  selectedWells,
  wellData,
  plateId,
  setSelectedWells,
  toggleWellSelection,
  setContextMenuPosition,
  setContextMenuType,
  setShowContextMenu,
  legend,
  previewWells, // Add previewWells prop
}) => {
  // Define all handlers directly in this component
  const handleWellClick = (wellId) => {
    // Toggle the well's selection status
    setSelectedWells((prev) =>
      prev.includes(wellId)
        ? prev.filter((id) => id !== wellId)
        : [...prev, wellId]
    );
  };

  const handleRowClick = (rowIndex, rowLabel) => {
    const { cols } = PLATE_TYPES[plateType];
    const rowWells = Array.from(
      { length: cols },
      (_, colIndex) => `${rowLabel}${colIndex + 1}`
    );

    // Toggle the row's wells without affecting other selections
    setSelectedWells((prev) => toggleWellSelection(rowWells, prev));
  };

  const handleColumnClick = (colIndex, colLabel) => {
    const { rows } = PLATE_TYPES[plateType];
    const colWells = Array.from(
      { length: rows },
      (_, rowIndex) => `${String.fromCharCode(65 + rowIndex)}${colLabel}`
    );

    // Toggle the column's wells without affecting other selections
    setSelectedWells((prev) => toggleWellSelection(colWells, prev));
  };

  const handleMultipleSelection = (wellIds, isToggle = false) => {
    if (isToggle) {
      // Toggle the wells without affecting other selections
      setSelectedWells((prev) => toggleWellSelection(wellIds, prev));
    } else {
      // Replace selection with the new wells
      setSelectedWells(wellIds);
    }
  };

  const openContextMenu = (event, type) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuType(type);
    setShowContextMenu(true);
  };

  return (
    <PlateMap
      plateType={plateType}
      onWellClick={handleWellClick}
      onRowClick={handleRowClick}
      onColumnClick={handleColumnClick}
      onMultipleSelection={handleMultipleSelection}
      selectedWells={selectedWells}
      wellData={wellData}
      id={plateId}
      onContextMenu={openContextMenu}
      legend={legend} // Pass the legend data to PlateMap
      previewWells={previewWells} // Pass previewWells to PlateMap
    />
  );
};

/**
 * A reusable plate map generator component
 * This component can be used in different contexts throughout the application
 * to create and edit plate layouts
 */
const PlateMapGenerator = ({
  initialPlateType = "96-well",
  onSavePlate,
  onDeletePlate,
  plateId,
  isNewPlate = true,
  plateData = {},
}) => {
  // State for the plate
  const [plateType, setPlateType] = useState(initialPlateType);
  const [selectedWells, setSelectedWells] = useState([]);
  const [wellData, setWellData] = useState(plateData.wellData || {});
  const [currentColors, setCurrentColors] = useState({
    fillColor: "#3b82f6", // Default blue for fill
    borderColor: "#000000", // Default black for border
    backgroundColor: "#f3f4f6", // Default light gray for background
  });
  const [activeColorElement, setActiveColorElement] = useState("fillColor");

  // Add legend state
  const [legend, setLegend] = useState(
    plateData.legend || {
      colors: {},
      colorOrder: {
        fillColor: [],
        borderColor: [],
        backgroundColor: [],
      },
    }
  );

  // Function to handle changing which color property is being edited
  const handleColorElementChange = useCallback(
    (elementType) => {
      setActiveColorElement(elementType);
      // When switching between color elements, update the color picker to show the current color for that element
      const currentColorForElement = currentColors[elementType];
      if (currentColorForElement) {
        // Only update the displayed color, don't apply to wells
        setCurrentColors((prev) => ({ ...prev }));
      }
    },
    [currentColors]
  );

  // UI elements for selecting which color property to edit
  const renderColorElement = () => (
    <div className="flex space-x-2 mb-3">
      {["fillColor", "borderColor", "backgroundColor"].map((element) => (
        <button
          key={element}
          onClick={() => handleColorElementChange(element)}
          className={`px-3 py-1 text-xs rounded-md ${
            activeColorElement === element
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
          }`}
        >
          {element === "fillColor"
            ? "Fill"
            : element === "borderColor"
            ? "Border"
            : "Background"}
        </button>
      ))}
    </div>
  );
  const [plateMetadata, setPlateMetadata] = useState(
    plateData.metadata || {
      name: plateData.name || `Plate ${plateId || 1}`,
      description: plateData.description || "",
      created: plateData.created || new Date().toISOString(),
    }
  );

  // Context menu state
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextMenuType, setContextMenuType] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);

  // Selection rectangle state (moved from PlateMap)
  const selectionContainerRef = useRef(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [wellPositions, setWellPositions] = useState({});
  const [previewWells, setPreviewWells] = useState([]);
  const previewDebounceRef = useRef(null);

  // Update well positions when wellData changes
  useEffect(() => {
    if (selectionContainerRef.current) {
      // Need to wait for the next render cycle to ensure wells are rendered
      const timer = setTimeout(() => {
        const positions = {};
        const containerRect =
          selectionContainerRef.current.getBoundingClientRect();

        // Select the actual wells (not well containers)
        const wellElements =
          selectionContainerRef.current.querySelectorAll("[data-well-id]");

        wellElements.forEach((wellElement) => {
          const wellId = wellElement.dataset.wellId;
          if (wellId) {
            const rect = wellElement.getBoundingClientRect();
            positions[wellId] = {
              x: rect.left - containerRect.left,
              y: rect.top - containerRect.top,
              width: rect.width,
              height: rect.height,
            };
          }
        });

        setWellPositions(positions);
      }, 100); // Short delay to ensure DOM is updated

      return () => clearTimeout(timer);
    }
  }, [wellData, plateType]);

  // Function to update preview wells with debouncing
  const updatePreviewWells = useCallback(
    (rect) => {
      // Clear any existing timer
      if (previewDebounceRef.current) {
        clearTimeout(previewDebounceRef.current);
      }

      // Set a new timer with a small delay for responsiveness
      previewDebounceRef.current = setTimeout(() => {
        if (rect && Object.keys(wellPositions).length > 0) {
          const potentialSelection = getWellsInRectangle(rect, wellPositions);
          setPreviewWells(potentialSelection);
        }
      }, 20);
    },
    [wellPositions]
  );

  // Mouse down handler for drag selection
  const handleMouseDown = useCallback((e) => {
    // Only act on left mouse button
    if (e.button !== 0) return;

    const containerRect = selectionContainerRef.current.getBoundingClientRect();
    const startX = e.clientX - containerRect.left;
    const startY = e.clientY - containerRect.top;

    // Store the starting point for the selection rectangle
    setSelectionStart({ x: startX, y: startY });
    setSelectionRect({ startX, startY, endX: startX, endY: startY });
    setIsSelecting(true);
  }, []);

  // Mouse move handler for drag selection
  const handleMouseMove = useCallback(
    (e) => {
      if (!isSelecting || !selectionStart) return;

      const containerRect =
        selectionContainerRef.current.getBoundingClientRect();
      const currentX = e.clientX - containerRect.left;
      const currentY = e.clientY - containerRect.top;

      // Update the end point of the selection rectangle
      const updatedRect = {
        startX: selectionStart.x,
        startY: selectionStart.y,
        endX: currentX,
        endY: currentY,
      };

      setSelectionRect(updatedRect);

      // Update preview wells
      updatePreviewWells(updatedRect);
    },
    [isSelecting, selectionStart, updatePreviewWells]
  );

  // Mouse up handler for drag selection
  const handleMouseUp = useCallback(
    (e) => {
      if (!isSelecting || !selectionStart) {
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
        if (selectedRegion.length > 0) {
          // If ctrl/cmd is pressed, toggle the selection instead of replacing it
          setSelectedWells((prev) => {
            if (isToggleMode) {
              return toggleWellSelection(selectedRegion, prev);
            } else {
              return selectedRegion;
            }
          });
        }
      }

      // Reset selection and preview state
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionRect(null);
      setPreviewWells([]);
    },
    [isSelecting, selectionRect, wellPositions, selectionStart]
  );

  // Touch handlers for mobile devices
  const handleTouchStart = useCallback((e) => {
    // Prevent default to avoid scrolling when starting selection
    e.preventDefault();

    const touch = e.touches[0];
    const containerRect = selectionContainerRef.current.getBoundingClientRect();
    const startX = touch.clientX - containerRect.left;
    const startY = touch.clientY - containerRect.top;

    // Store the starting point for the touch selection
    setSelectionStart({ x: startX, y: startY });
    setSelectionRect({ startX, startY, endX: startX, endY: startY });
    setIsSelecting(true);
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (!isSelecting || !selectionStart) return;

      // Prevent default to stop scrolling while selecting
      e.preventDefault();

      const touch = e.touches[0];
      const containerRect =
        selectionContainerRef.current.getBoundingClientRect();
      const currentX = touch.clientX - containerRect.left;
      const currentY = touch.clientY - containerRect.top;

      // Update the end point of the touch selection rectangle
      const updatedRect = {
        startX: selectionStart.x,
        startY: selectionStart.y,
        endX: currentX,
        endY: currentY,
      };

      setSelectionRect(updatedRect);

      // Update preview wells
      updatePreviewWells(updatedRect);
    },
    [isSelecting, selectionStart, updatePreviewWells]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      // Prevent default to avoid accidental clicks
      if (e && e.cancelable) {
        e.preventDefault();
      }

      if (!isSelecting || !selectionStart) {
        setIsSelecting(false);
        return;
      }

      // Calculate wells inside the touch selection rectangle
      if (selectionRect && Object.keys(wellPositions).length > 0) {
        const selectedRegion = getWellsInRectangle(
          selectionRect,
          wellPositions
        );

        // Trigger selection update with the wells in the region
        if (selectedRegion.length > 0) {
          setSelectedWells(selectedRegion);
        }
      }

      // Reset selection and preview state
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionRect(null);
      setPreviewWells([]);
    },
    [isSelecting, selectionRect, wellPositions, selectionStart]
  );

  // Clean up preview timer on unmount
  useEffect(() => {
    return () => {
      if (previewDebounceRef.current) {
        clearTimeout(previewDebounceRef.current);
      }
    };
  }, []);

  // Helper function to toggle multiple well selections
  const toggleWellSelection = (wellIds, currentSelection) => {
    // Check if all wells in wellIds are already selected
    const allSelected = wellIds.every((id) => currentSelection.includes(id));

    if (allSelected) {
      // If all are selected, remove them all from selection
      return currentSelection.filter((id) => !wellIds.includes(id));
    } else {
      // Otherwise, add any wells that aren't already selected
      const newSelection = [...currentSelection];
      wellIds.forEach((id) => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    }
  };

  // Enhanced color change handler for multiple color elements
  const handleColorChange = useCallback(
    (color, elementType = activeColorElement) => {
      // Update the current color for this element type
      setCurrentColors((prev) => ({
        ...prev,
        [elementType]: color,
      }));

      // Apply color to selected wells
      if (selectedWells.length > 0) {
        setWellData((prev) => {
          const newWellData = { ...prev };
          selectedWells.forEach((wellId) => {
            // Create or update the well data
            if (color === "transparent") {
              // If transparent, remove the property if it exists
              if (newWellData[wellId]) {
                const updatedWell = { ...newWellData[wellId] };
                delete updatedWell[elementType];

                // If the well has no remaining properties, remove it entirely
                if (Object.keys(updatedWell).length === 0) {
                  delete newWellData[wellId];
                } else {
                  newWellData[wellId] = updatedWell;
                }
              }
            } else {
              // Otherwise set the color normally
              newWellData[wellId] = {
                ...newWellData[wellId], // Keep existing properties
                [elementType]: color, // Update only the specific color element
              };
            }
          });
          return newWellData;
        });
      }
    },
    [selectedWells, activeColorElement]
  );

  // Handle legend changes from the Legend component
  const handleLegendChange = useCallback((newLegend) => {
    // Ensure we're preserving the colorOrder if it exists in the new legend
    setLegend((prevLegend) => ({
      ...prevLegend,
      ...newLegend,
      // Make sure colorOrder always exists
      colorOrder: newLegend.colorOrder ||
        prevLegend.colorOrder || {
          fillColor: [],
          borderColor: [],
          backgroundColor: [],
        },
    }));

    console.log("Legend updated with new color order:", newLegend.colorOrder);
  }, []);

  // Enhanced clear handler to support both selection clearing and full reset with undo functionality
  const [undoStack, setUndoStack] = useState([]);
  const [canUndo, setCanUndo] = useState(false);

  // Add undo button next to the selected wells display
  const renderUndoButton = () => {
    if (canUndo) {
      return (
        <button
          onClick={handleUndo}
          className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
          title="Undo last action"
        >
          Undo
        </button>
      );
    }
    return null;
  };

  const handleClearSelection = useCallback(
    (mode = "selection") => {
      // Store the previous state for undo functionality
      const previousWellData = { ...wellData };
      const previousSelectedWells = [...selectedWells];
      const previousLegend = { ...legend }; // Also store legend state for undo

      // Add to undo stack
      setUndoStack((prev) => [
        ...prev,
        {
          wellData: previousWellData,
          selectedWells: previousSelectedWells,
          legend: previousLegend,
        },
      ]);
      setCanUndo(true);

      if (mode === "reset") {
        // Full reset: Clear colors, selection, and legend
        setWellData({});
        setSelectedWells([]);
        setLegend({
          colors: {},
          colorOrder: {
            fillColor: [],
            borderColor: [],
            backgroundColor: [],
          },
        }); // Reset legend with empty colorOrder
        console.log("Reset plate - cleared all colors, selections, and legend");
      } else {
        // Just clear selection, keep colors and legend
        setSelectedWells([]);
        console.log("Cleared selection only");
      }
    },
    [wellData, selectedWells, legend]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      // Get the last state from the undo stack
      const lastState = undoStack[undoStack.length - 1];

      // Restore previous state including legend
      setWellData(lastState.wellData);
      setSelectedWells(lastState.selectedWells);
      if (lastState.legend) {
        setLegend(lastState.legend);
      }

      // Remove the used state from the stack
      setUndoStack((prev) => prev.slice(0, -1));
      setCanUndo(undoStack.length > 1);

      console.log("Undo operation completed");
    }
  }, [undoStack]);

  const handlePlateTypeChange = useCallback((newPlateType) => {
    setPlateType(newPlateType);
    setSelectedWells([]);
  }, []);

  const handleSavePlate = useCallback(() => {
    if (onSavePlate) {
      onSavePlate({
        id: plateId,
        type: plateType,
        wellData,
        legend, // Include legend in the saved plate data
        metadata: plateMetadata,
      });
    }
    setSelectedWells([]);
  }, [plateId, plateType, wellData, legend, plateMetadata, onSavePlate]);

  const handleDeletePlate = useCallback(() => {
    if (onDeletePlate) onDeletePlate(plateId);
  }, [plateId, onDeletePlate]);

  const closeContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  // Handler for clearing context menu items
  const handleClearContext = useCallback(() => {
    // Implement the context menu clear behavior
    if (selectedWells.length > 0) {
      // Remove colors from selected wells based on context menu type
      setWellData((prev) => {
        const newWellData = { ...prev };
        selectedWells.forEach((wellId) => {
          if (newWellData[wellId]) {
            delete newWellData[wellId];
          }
        });
        return newWellData;
      });
    }
    closeContextMenu();
  }, [selectedWells, closeContextMenu]);

  return (
    <div className="plate-map-generator border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
      {/* Plate Information */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Plate name"
          value={plateMetadata.name}
          onChange={(e) =>
            setPlateMetadata({ ...plateMetadata, name: e.target.value })
          }
          className="w-full px-3 py-2 text-base font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
        />

        {/* Add description input to use the description field */}
        <textarea
          placeholder="Plate description"
          value={plateMetadata.description}
          onChange={(e) =>
            setPlateMetadata({ ...plateMetadata, description: e.target.value })
          }
          className="w-full mt-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          rows="2"
        />

        {/* Display created date */}
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Created: {new Date(plateMetadata.created).toLocaleString()}
        </div>
      </div>

      {/* Controls */}
      <PlateMapControls
        plateType={plateType}
        onPlateTypeChange={handlePlateTypeChange}
        onSave={handleSavePlate}
        onClear={handleClearSelection}
        onDelete={handleDeletePlate}
        onColorChange={handleColorChange}
        color={currentColors[activeColorElement]}
        selectedElements={selectedWells}
        plateId={plateId}
        isNew={isNewPlate}
        showContextMenu={showContextMenu}
        contextMenuPosition={contextMenuPosition}
        contextMenuType={contextMenuType}
        onCloseContextMenu={closeContextMenu}
        onClearContext={handleClearContext}
        renderColorElement={renderColorElement}
      />

      {/* Two-column layout for plate map and legend with selection rectangle container */}
      <div
        ref={selectionContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ position: "relative" }}
        className="flex flex-col md:flex-row gap-4"
      >
        {/* Plate Map - Using the wrapper component */}
        <div className="md:flex-1">
          <PlateMapWrapper
            plateType={plateType}
            selectedWells={selectedWells}
            wellData={wellData}
            plateId={plateId}
            setSelectedWells={setSelectedWells}
            toggleWellSelection={toggleWellSelection}
            setContextMenuPosition={setContextMenuPosition}
            setContextMenuType={setContextMenuType}
            setShowContextMenu={setShowContextMenu}
            legend={legend}
            previewWells={previewWells}
          />
        </div>

        {/* Legend Section */}
        <div className="md:w-64 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
          <PlateMapLegend
            wellData={wellData}
            legend={legend}
            onLegendChange={handleLegendChange}
          />
        </div>

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
              zIndex: 50,
            }}
          />
        )}
      </div>

      {/* Selected Wells Display */}
      {selectedWells.length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">
          <div className="flex justify-between items-center">
            <span>
              Selected:{" "}
              {selectedWells.length > 10
                ? `${selectedWells.slice(0, 10).join(", ")}... (${
                    selectedWells.length
                  } total)`
                : selectedWells.join(", ")}
            </span>
            <div className="flex space-x-1">
              {renderUndoButton()}
              <button
                onClick={() => handleClearSelection()}
                className="text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlateMapGenerator;
