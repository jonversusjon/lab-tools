import { useState, useCallback } from "react";
import PlateMapGenerator from "./PlateMapGenerator";

/**
 * Component to manage a collection of plate maps
 * Allows adding, saving, and removing multiple plates
 */
const PlateMapCollector = ({ onPlatesChange, initialPlates = [] }) => {
  const [plates, setPlates] = useState(initialPlates);
  const [nextPlateId, setNextPlateId] = useState(
    initialPlates.length > 0
      ? Math.max(...initialPlates.map((p) => p.id)) + 1
      : 1
  );

  // Add a new plate to the collection
  const handleAddPlate = useCallback(() => {
    const newPlate = {
      id: nextPlateId,
      type: "96-well", // Default type
      wellData: {},
      metadata: {
        name: `Plate ${nextPlateId}`,
        description: "",
        created: new Date().toISOString(),
      },
    };

    setPlates((prev) => [...prev, newPlate]);
    setNextPlateId((prev) => prev + 1);

    if (onPlatesChange) {
      onPlatesChange([...plates, newPlate]);
    }
  }, [nextPlateId, plates, onPlatesChange]);

  // Save changes to a plate
  const handleSavePlate = useCallback(
    (updatedPlate) => {
      setPlates((prev) =>
        prev.map((plate) =>
          plate.id === updatedPlate.id ? updatedPlate : plate
        )
      );

      if (onPlatesChange) {
        onPlatesChange(
          plates.map((plate) =>
            plate.id === updatedPlate.id ? updatedPlate : plate
          )
        );
      }
    },
    [plates, onPlatesChange]
  );

  // Delete a plate from the collection
  const handleDeletePlate = useCallback(
    (plateId) => {
      setPlates((prev) => prev.filter((plate) => plate.id !== plateId));

      if (onPlatesChange) {
        onPlatesChange(plates.filter((plate) => plate.id !== plateId));
      }
    },
    [plates, onPlatesChange]
  );

  return (
    <div className="plate-map-collector">
      {/* Existing plates */}
      {plates.map((plate) => (
        <div key={plate.id} className="mb-6 w-full">
          <PlateMapGenerator
            initialPlateType={plate.type}
            onSavePlate={handleSavePlate}
            onDeletePlate={handleDeletePlate}
            plateId={plate.id}
            isNewPlate={false}
            plateData={plate}
          />
        </div>
      ))}

      {/* Add plate button */}
      <div className="flex justify-center my-6">
        <button
          onClick={handleAddPlate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Plate
        </button>
      </div>
    </div>
  );
};

export default PlateMapCollector;
