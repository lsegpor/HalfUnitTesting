// Placement definitions for the Half-Unit GUI.
//
// On load the canvas shows only the background (C-frame, cooling plate,
// f3 plate top and adapter plates). The moderator places the remaining
// components one by one: pick a type, then click an empty slot.
//
// Placement state is per-variant: a component placed in one orientation
// does NOT appear in the others. See `initPlacement` for the shape.
//
// Slots are derived directly from positions.json (variant 0), so this file
// never hardcodes slot lists: adding/removing a slot in positions.json is
// enough for it to appear here, in the palette and on the canvas.

import fpobPositions from "./fpobPositions.json";
import rpobPositions from "./rpobPositions.json";
import modulePositions from "./modulePositions.json";
import rob3Positions from "./rob3Positions.json";

// Component types the moderator can place. Order fixes palette ordering;
// the actual slot ids are collected from positions.json by prefix.
const TYPE_META = [
  { type: "module", label: "Module" },
  { type: "rob3", label: "ROB3" },
  { type: "fpob", label: "FPOB" },
  { type: "rpob", label: "RPOB" },
];

// Background prefixes are always visible and never placeable.
const BACKGROUND_PREFIXES = ["adapter", "f3plate", "cooling"];

// Natural sort by the numeric suffix (module-2 before module-10).
function bySuffix(a, b) {
  return Number(a.split("-")[1]) - Number(b.split("-")[1]);
}

const POSITIONS_BY_TYPE = {
  module: modulePositions,
  rob3: rob3Positions,
  fpob: fpobPositions,
  rpob: rpobPositions,
};

function slotsForType(type) {
  return Object.keys(POSITIONS_BY_TYPE[type]["0"]).sort(bySuffix);
}

// Placeable types with their slot lists, derived from positions.json.
export const PLACEABLE_TYPES = TYPE_META.map(({ type, label }) => ({
  type,
  label,
  slots: slotsForType(type),
}));

// Flat list of every placeable slot id (across all types).
export const ALL_PLACEABLE_SLOTS = PLACEABLE_TYPES.flatMap((t) => t.slots);

// True if a componentId is always-visible background (not placeable).
export function isBackground(componentId) {
  return BACKGROUND_PREFIXES.some((p) => componentId.startsWith(`${p}-`));
}

// Maps a slot id (componentId) to its type definition.
export function typeForSlot(slotId) {
  return PLACEABLE_TYPES.find((t) => t.slots.includes(slotId));
}

// Initial placement state: { [variant]: { [componentId]: false } }.
// Every placeable slot starts unplaced in all four orientations.
export function initPlacement() {
  const result = {};
  for (let v = 0; v < 4; v++) {
    result[v] = {};
    for (const slot of ALL_PLACEABLE_SLOTS) {
      result[v][slot] = false;
    }
  }
  return result;
}
