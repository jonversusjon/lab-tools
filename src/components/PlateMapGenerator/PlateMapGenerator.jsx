import { useState, useCallback, useRef, useEffect } from "react";
import PlateMap from "./PlateMap";
import { PLATE_TYPES } from "./PlateTypes";
import PlateMapControls from "./PlateMapControls";
import PlateMapLegend from "./PlateMapLegend";
import { getWellsInRectangle } from "../../utils";
import { useUndo, useCanUndo } from "../../contexts/UndoContext";
import html2canvas from "html2canvas-pro";
import { Copy, Download, LayoutTemplate, PenTool } from "lucide-react"; // Import new icons

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
    setSelectedWells((prev) => {
      const isSelected = prev.includes(wellId);
      return isSelected
        ? prev.filter((id) => id !== wellId)
        : [...prev, wellId];
    });
  };

  const handleRowClick = (rowIndex, rowLabel) => {
    const { cols } = PLATE_TYPES[plateType];
    const rowWells = Array.from(
      { length: cols },
      (_, colIndex) => `${rowLabel}${colIndex + 1}`
    );

    // Rule: if all selected OR all unselected, toggle all; else turn all on
    setSelectedWells((prev) => {
      const allSelected = rowWells.every((id) => prev.includes(id));
      const allUnselected = rowWells.every((id) => !prev.includes(id));

      if (allSelected) {
        // All selected -> deselect all
        return prev.filter((id) => !rowWells.includes(id));
      } else if (allUnselected) {
        // All unselected -> select all
        return [...prev, ...rowWells];
      } else {
        // Mixed state -> turn all on (add any missing)
        const newSelection = [...prev];
        rowWells.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      }
    });
  };

  const handleColumnClick = (colIndex, colLabel) => {
    const { rows } = PLATE_TYPES[plateType];
    const colWells = Array.from(
      { length: rows },
      (_, rowIndex) => `${String.fromCharCode(65 + rowIndex)}${colLabel}`
    );

    // Rule: if all selected OR all unselected, toggle all; else turn all on
    setSelectedWells((prev) => {
      const allSelected = colWells.every((id) => prev.includes(id));
      const allUnselected = colWells.every((id) => !prev.includes(id));

      if (allSelected) {
        // All selected -> deselect all
        return prev.filter((id) => !colWells.includes(id));
      } else if (allUnselected) {
        // All unselected -> select all
        return [...prev, ...colWells];
      } else {
        // Mixed state -> turn all on (add any missing)
        const newSelection = [...prev];
        colWells.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      }
    });
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
  const [copyButtonText, setCopyButtonText] = useState("Copy PNG");
  const [downloadButtonText, setDownloadButtonText] = useState("Download PNG");

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

  // Global undo context - must be called before any functions that use it
  const { pushUndo, undo } = useUndo();
  const canUndo = useCanUndo();

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
          className={`px-3 py-1 text-xs rounded-md ${activeColorElement === element
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

  // Presentation Mode state
  const [viewMode, setViewMode] = useState("edit");
  const presentationRef = useRef(null);

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
      // Use requestAnimationFrame to ensure wells are rendered
      const rafId = requestAnimationFrame(() => {
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
      });

      return () => cancelAnimationFrame(rafId);
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

    // Don't start selection if well positions aren't ready
    if (Object.keys(wellPositions).length === 0) {
      return;
    }

    // Check if clicking on a well, row header, or column header
    // If so, let the click handler deal with it instead of starting drag
    const target = e.target;
    const isWell = target.closest('[data-well-id]');
    const isRowHeader = target.closest('[data-row-index]');
    const isColumnHeader = target.closest('[data-col-index]');

    if (isWell || isRowHeader || isColumnHeader) {
      // Don't start drag selection - let click handlers work
      return;
    }

    const containerRect = selectionContainerRef.current.getBoundingClientRect();
    const startX = e.clientX - containerRect.left;
    const startY = e.clientY - containerRect.top;

    // Store the starting point for the selection rectangle
    setSelectionStart({ x: startX, y: startY });
    setSelectionRect({ startX, startY, endX: startX, endY: startY });
    setIsSelecting(true);
  }, [wellPositions]);

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

      // Check if this was actually a drag or just a click
      const dragThreshold = 5; // pixels
      const dragDistance = Math.sqrt(
        Math.pow(selectionRect.endX - selectionRect.startX, 2) +
        Math.pow(selectionRect.endY - selectionRect.startY, 2)
      );

      // Only process as drag selection if user actually dragged
      if (dragDistance >= dragThreshold && selectionRect && Object.keys(wellPositions).length > 0) {
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
      // If dragDistance < threshold, it's a click - let the well's onClick handle it

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
    // Don't start selection if well positions aren't ready
    if (Object.keys(wellPositions).length === 0) return;

    // Check if touching on a well, row header, or column header
    const target = e.target;
    const isWell = target.closest('[data-well-id]');
    const isRowHeader = target.closest('[data-row-index]');
    const isColumnHeader = target.closest('[data-col-index]');

    if (isWell || isRowHeader || isColumnHeader) {
      // Don't start drag selection - let click handlers work
      return;
    }

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
  }, [wellPositions]);

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

      // Check if this was actually a drag or just a tap
      const dragThreshold = 5; // pixels
      const dragDistance = Math.sqrt(
        Math.pow(selectionRect.endX - selectionRect.startX, 2) +
        Math.pow(selectionRect.endY - selectionRect.startY, 2)
      );

      // Only process as drag selection if user actually dragged
      if (dragDistance >= dragThreshold && selectionRect && Object.keys(wellPositions).length > 0) {
        const selectedRegion = getWellsInRectangle(
          selectionRect,
          wellPositions
        );

        // Check for modifier keys to determine the selection behavior
        // Touch events can have modifier keys if user is holding a key while touching
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
      // If dragDistance < threshold, it's a tap - let the well's onClick handle it

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
        // Store previous state for undo
        const previousWellData = JSON.parse(JSON.stringify(wellData));
        const affectedWells = [...selectedWells];
        const colorTypeName = elementType === "fillColor" ? "Fill" :
          elementType === "borderColor" ? "Border" : "Background";

        // Push undo action
        pushUndo(`Apply ${colorTypeName} Color`, () => {
          setWellData(previousWellData);
        });

        setWellData((prev) => {
          const newWellData = { ...prev };
          affectedWells.forEach((wellId) => {
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
    [selectedWells, activeColorElement, wellData, pushUndo]
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

  }, []);

  // Add undo button next to the selected wells display
  const renderUndoButton = () => {
    if (canUndo) {
      return (
        <button
          onClick={undo}
          className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
          title="Undo last action (Ctrl+Z)"
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
      const previousLegend = JSON.parse(JSON.stringify(legend)); // Deep copy legend

      if (mode === "reset") {
        // Push undo action for reset
        pushUndo("Reset Plate", () => {
          setWellData(previousWellData);
          setSelectedWells(previousSelectedWells);
          setLegend(previousLegend);
        });

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
        });
      } else {
        // Push undo action for clear selection
        pushUndo("Clear Selection", () => {
          setSelectedWells(previousSelectedWells);
        });

        // Just clear selection, keep colors and legend
        setSelectedWells([]);
      }
    },
    [wellData, selectedWells, legend, pushUndo]
  );

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

  const handleCopyImage = async () => {
    // Basic ref check
    let element = presentationRef.current;
    if (!element) {
      console.warn("Presentation ref not found, trying ID fallback");
      element = document.getElementById("presentation-view");
    }
    if (!element) {
      console.error("No element found to capture");
      setCopyButtonText("Error: No Element");
      setTimeout(() => setCopyButtonText("Copy PNG"), 2000);
      return;
    }

    setCopyButtonText("Generating...");

    // Give UI time to update
    setTimeout(async () => {
      const generateBlob = async (scale) => {
        try {
          console.log(`Attempting capture at scale ${scale}...`);
          const canvas = await html2canvas(element, {
            backgroundColor: null,
            scale: scale,
            logging: false,
            useCORS: false,
            allowTaint: false,
            onclone: (clonedDoc) => {
              const clonedElement = clonedDoc.getElementById("presentation-view");
              if (clonedElement) {
                // Make the container transparent and remove borders/shadows
                clonedElement.style.backgroundColor = "transparent";
                clonedElement.style.boxShadow = "none";
                clonedElement.style.border = "none";
              }
            }
          });

          console.log(`Canvas created: ${canvas.width}x${canvas.height}`);
          
          if (canvas.width === 0 || canvas.height === 0) {
            throw new Error("Canvas has 0 dimensions");
          }

          return new Promise((resolve, reject) => {
            try {
              canvas.toBlob((blob) => {
                if (!blob) reject(new Error("Blob is null"));
                else resolve(blob);
              }, 'image/png');
            } catch (e) {
              reject(e);
            }
          });
        } catch (err) {
          console.error(`Capture failed at scale ${scale}:`, err);
          return null;
        }
      };

      try {
        if (!navigator.clipboard) {
           console.error("Clipboard API not available");
           setCopyButtonText("No Clipboard API");
           setTimeout(() => setCopyButtonText("Copy PNG"), 2000);
           return;
        }

        // Try high quality first (Scale 3 should work now with html2canvas-pro)
        let blob = await generateBlob(3);
        
        // If failed, try standard quality
        if (!blob) {
          console.warn("High quality capture failed, retrying with standard quality...");
          blob = await generateBlob(1);
        }

        if (blob) {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          setCopyButtonText("Copied!");
          setTimeout(() => setCopyButtonText("Copy PNG"), 2000);
        } else {
          console.error("All blob generation attempts failed");
          setCopyButtonText("Failed: Gen Err");
          setTimeout(() => setCopyButtonText("Copy PNG"), 2000);
        }
      } catch (err) {
        console.error("Failed to copy image:", err);
        setCopyButtonText("Failed: Write Err");
        setTimeout(() => setCopyButtonText("Copy PNG"), 2000);
      }
    }, 50);
  };

  const handleDownloadImage = async () => {
    let element = presentationRef.current;
    if (!element) {
      element = document.getElementById("presentation-view");
    }
    if (!element) {
       console.error("No element found for download");
       setDownloadButtonText("Error: No Element");
       setTimeout(() => setDownloadButtonText("Download PNG"), 2000);
       return;
    }

    setDownloadButtonText("Generating...");

    // Give UI time to update
    setTimeout(async () => {
      try {
        const generateCanvas = async (scale) => {
           try {
             return await html2canvas(element, {
              backgroundColor: null,
              scale: scale,
              logging: false,
              useCORS: false,
              allowTaint: false,
              onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById("presentation-view");
                if (clonedElement) {
                  // Make the container transparent and remove borders/shadows
                  clonedElement.style.backgroundColor = "transparent";
                  clonedElement.style.boxShadow = "none";
                  clonedElement.style.border = "none";
                }
              }
            });
           } catch (e) {
             console.error(`Download capture failed at scale ${scale}`, e);
             return null;
           }
        };

        // Try high quality first
        let canvas = await generateCanvas(3);

        // Retry if needed
        if (!canvas) {
           console.warn("High quality download failed, retrying...");
           canvas = await generateCanvas(1);
        }

        if (!canvas) {
          throw new Error("Canvas generation failed");
        }
        
        console.log(`Download canvas: ${canvas.width}x${canvas.height}`);

        const link = document.createElement("a");
        link.download = `plate-map-${plateMetadata.name || "export"}.png`;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link); 
        link.click();
        document.body.removeChild(link);
        
        setDownloadButtonText("Downloaded!");
        setTimeout(() => setDownloadButtonText("Download PNG"), 2000);
      } catch (err) {
        console.error("Failed to download image:", err);
        setDownloadButtonText("Failed!");
        setTimeout(() => setDownloadButtonText("Download PNG"), 2000);
      }
    }, 50);
  };

  if (viewMode === "presentation") {
    return (
      <div className="plate-map-generator flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-auto">
        {/* Presentation Toolbar */}
        <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto w-full">
          <button
            onClick={() => setViewMode("edit")}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PenTool className="w-4 h-4" /> Edit Plate
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleCopyImage}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Copy className="w-4 h-4" /> {copyButtonText}
            </button>
            <button
              onClick={handleDownloadImage}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4" /> {downloadButtonText}
            </button>
          </div>
        </div>

        {/* Capture Area */}
        <div className="flex-1 flex justify-center pb-8 overflow-auto">
          <div
            ref={presentationRef}
            id="presentation-view"
            className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-fit min-w-[800px] max-w-full mx-auto"
          >
            <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {plateMetadata.name || "Untitled Plate"}
              </h1>
              {plateMetadata.description && (
                <p className="text-gray-500 dark:text-gray-400 text-base">
                  {plateMetadata.description}
                </p>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 min-w-[500px]">
                <PlateMap
                  plateType={plateType}
                  wellData={wellData}
                  selectedWells={[]} // Hide selection
                  readOnly={true}
                  legend={legend}
                />
              </div>

              <div className="w-64 shrink-0 pt-2 border-l border-gray-100 dark:border-gray-700 pl-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">Legend</h3>
                <PlateMapLegend
                  wellData={wellData}
                  legend={legend}
                  colorOrder={legend.colorOrder}
                  readOnly={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="plate-map-generator border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
      {/* Header & Controls */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-4">
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

        <button
          onClick={() => setViewMode("presentation")}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
          title="Switch to Presentation Mode (Export PNG)"
        >
          <LayoutTemplate className="w-4 h-4" />
          <span className="hidden sm:inline">Done Editing</span>
        </button>
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

      {/* Two-column layout for plate map and legend */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Plate Map with selection rectangle container */}
        <div className="md:flex-1">
          <div
            ref={selectionContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ position: "relative", padding: "40px" }}
          >
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
        </div>

        {/* Legend Section */}
        <div className="md:w-64 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
          <PlateMapLegend
            wellData={wellData}
            legend={legend}
            onLegendChange={handleLegendChange}
          />
        </div>
      </div>

      {/* Selected Wells Display */}
      {selectedWells.length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">
          <div className="flex justify-between items-center">
            <span>
              Selected:{" "}
              {selectedWells.length > 10
                ? `${selectedWells.slice(0, 10).join(", ")}... (${selectedWells.length
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
