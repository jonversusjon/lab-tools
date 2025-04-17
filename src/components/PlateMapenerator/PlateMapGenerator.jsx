import { useState, useCallback } from "react";
import PlateMap from "./PlateMap";
import { PLATE_TYPES } from "./PlateTypes";
import PlateMapControls from "./PlateMapControls";

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

  // Handle well selection
  const handleWellClick = useCallback((wellId) => {
    setSelectedWells((prev) =>
      prev.includes(wellId)
        ? prev.filter((id) => id !== wellId)
        : [...prev, wellId]
    );
  }, []);

  // Handle row selection
  const handleRowClick = useCallback(
    (rowIndex, rowLabel) => {
      const cols = PLATE_TYPES[plateType].cols;
      const rowWells = Array.from(
        { length: cols },
        (_, colIndex) => `${rowLabel}${colIndex + 1}`
      );
      setSelectedWells(rowWells);
    },
    [plateType]
  );

  // Handle column selection
  const handleColumnClick = useCallback(
    (colIndex, colLabel) => {
      const { rows } = PLATE_TYPES[plateType];
      const colWells = Array.from(
        { length: rows },
        (_, rowIndex) => `${String.fromCharCode(65 + rowIndex)}${colLabel}`
      );
      setSelectedWells(colWells);
    },
    [plateType]
  );

  // Handle color change
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

  // Handle clearing selected wells
  const handleClearSelection = useCallback(() => {
    setWellData((prev) => {
      const newWellData = { ...prev };
      selectedWells.forEach((wellId) => delete newWellData[wellId]);
      return newWellData;
    });
    setSelectedWells([]);
  }, [selectedWells]);

  // Handle plate type change
  const handlePlateTypeChange = useCallback((newPlateType) => {
    setPlateType(newPlateType);
    setSelectedWells([]);
  }, []);

  // Handle save plate
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

  // Handle delete plate
  const handleDeletePlate = useCallback(() => {
    if (onDeletePlate) onDeletePlate(plateId);
  }, [plateId, onDeletePlate]);

  // Context menu handler
  const openContextMenu = useCallback((event, type) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuType(type);
    setShowContextMenu(true);
  }, []);

  // Add handler to close context menu (can be triggered by PlateMapControls)
  const closeContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

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

      {/* Plate Map */}
      <PlateMap
        plateType={plateType}
        onWellClick={handleWellClick}
        onRowClick={handleRowClick}
        onColumnClick={handleColumnClick}
        selectedWells={selectedWells}
        wellData={wellData}
        id={plateId} // Ensure plateId is passed correctly
        // Pass openContextMenu to PlateMap to trigger on right-click
        onContextMenu={openContextMenu}
      />

      {/* Selected Wells Display */}
      {selectedWells.length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">
          Selected: {selectedWells.join(", ")}
        </div>
      )}
    </div>
  );
};

export default PlateMapGenerator;
