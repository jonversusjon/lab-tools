import { useState, useCallback } from "react";
import PlateMap from "./PlateMap";
import { PLATE_TYPES } from "./PlateTypes";
import PlateMapControls from "./PlateMapControls";

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
  const [currentColor, setCurrentColor] = useState("#3b82f6"); // Default blue
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

  // Rest of the handlers (that don't need to be accessed by PlateMap)
  const handleColorChange = useCallback(
    (color) => {
      setCurrentColor(color);
      if (selectedWells.length > 0) {
        setWellData((prev) => {
          const newWellData = { ...prev };
          selectedWells.forEach((wellId) => {
            newWellData[wellId] = { ...newWellData[wellId], color };
          });
          return newWellData;
        });
      }
    },
    [selectedWells]
  );

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

      // Add to undo stack
      setUndoStack((prev) => [
        ...prev,
        { wellData: previousWellData, selectedWells: previousSelectedWells },
      ]);
      setCanUndo(true);

      if (mode === "reset") {
        // Full reset: Clear colors and selection
        setWellData({});
        setSelectedWells([]);
        console.log("Reset plate - cleared all colors and selections");
      } else {
        // Just clear selection, keep colors
        setSelectedWells([]);
        console.log("Cleared selection only");
      }
    },
    [wellData, selectedWells]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      // Get the last state from the undo stack
      const lastState = undoStack[undoStack.length - 1];

      // Restore previous state
      setWellData(lastState.wellData);
      setSelectedWells(lastState.selectedWells);

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
        metadata: plateMetadata,
      });
    }
    setSelectedWells([]);
  }, [plateId, plateType, wellData, plateMetadata, onSavePlate]);

  const handleDeletePlate = useCallback(() => {
    if (onDeletePlate) onDeletePlate(plateId);
  }, [plateId, onDeletePlate]);

  const closeContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  return (
    <div className="plate-map-generator max-w-3xl border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
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
        color={currentColor}
        selectedElements={selectedWells}
        plateId={plateId} // Ensure plateId is passed correctly
        isNew={isNewPlate}
        // Pass context menu props
        showContextMenu={showContextMenu}
        contextMenuPosition={contextMenuPosition}
        contextMenuType={contextMenuType}
        onCloseContextMenu={closeContextMenu}
        // Pass openContextMenu if needed by controls (e.g., for a general plate context menu)
        // openContextMenu={openContextMenu}
      />

      {/* Plate Map - Using the wrapper component */}
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
      />

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
