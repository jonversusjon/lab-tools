// Constants for different plate types and their dimensions
export const PLATE_TYPES = {
  "384-well": { rows: 16, cols: 24, type: "well" },
  "96-well": { rows: 8, cols: 12, type: "well" },
  "48-well": { rows: 6, cols: 8, type: "well" },
  "24-well": { rows: 4, cols: 6, type: "well" },
  "12-well": { rows: 3, cols: 4, type: "well" },
  "6-well": { rows: 2, cols: 3, type: "well" },
  "10cm": { rows: 1, cols: 1, type: "dish" },
  "15cm": { rows: 1, cols: 1, type: "dish" },
  T25: { rows: 1, cols: 1, type: "flask" },
  T75: { rows: 1, cols: 1, type: "flask" },
  T175: { rows: 1, cols: 1, type: "flask" },
  T225: { rows: 1, cols: 1, type: "flask" },
  "1-chamber": { rows: 1, cols: 1, type: "chamber" },
  "2-chamber": { rows: 1, cols: 2, type: "chamber" },
  "4-chamber": { rows: 2, cols: 2, type: "chamber" },
  "8-chamber": { rows: 2, cols: 4, type: "chamber" },
  "16-chamber": { rows: 4, cols: 4, type: "chamber" },
};

// Standard aspect ratio for plates (width:height)
export const PLATE_RATIO = 1.5;
