// Canonic definition of default tasks for each component type.
// App.jsx uses this to initialize the global task state.

import { ALL_PLACEABLE_SLOTS } from "./placement";

const MODULE_ANCHORS = ["base"];
const ROB3_ANCHORS = [
  "ohole",
  "ihole",
  "data0",
  "data1",
  "data2",
  "data3",
  "data4",
];
const FPOB_ANCHORS = [
  "conn0",
  "conn1",
  "conn2",
  "conn3",
  "feast4",
  "feast5",
  "feast6",
  "feast7",
  "feast8",
  "feast9",
  "feast10",
  "feast11",
  "feast12",
  "feast13",
  "feast14",
  "feast15",
];
const RPOB_ANCHORS = ["component"];

const MODULE_DEFAULTS = [
  { text: "Connect data cables", done: false },
  { text: "Connect power cables", done: false },
  { text: "Verify data cables", done: false },
  { text: "Verify power cables", done: false },
];
const ROB3_DEFAULTS = [
  { text: "Connect data cables", done: false },
  { text: "Connect power cables", done: false },
  { text: "Verify data cables", done: false },
  { text: "Verify power cables", done: false },
];
const FPOB_DEFAULTS = [
  { text: "Connect data cables", done: false },
  { text: "Connect power cables", done: false },
  { text: "Verify data cables", done: false },
  { text: "Verify power cables", done: false },
];
const RPOB_DEFAULTS = [
  { text: "Connect data cables", done: false },
  { text: "Connect power cables", done: false },
  { text: "Verify data cables", done: false },
  { text: "Verify power cables", done: false },
];

// Default tasks attached to each cable. Cables are created dynamically,
// so their task list is initialized lazily the first time their modal opens.
const CABLE_DEFAULTS = [
  { text: "Route the cable", done: false },
  { text: "Connect both ends", done: false },
  { text: "Verify the connection", done: false },
  { text: "Label the cable", done: false },
];

// Returns a fresh copy of the default cable task list
export function defaultCableTasks() {
  return CABLE_DEFAULTS.map((t) => ({ ...t }));
}

// Builds the per-anchor task map for a component. The modal shows a single
// flat list per component, so the default tasks live only on the first anchor;
// every other anchor starts empty to avoid duplicating tasks across anchors.
function buildTaskMap(anchors, defaults) {
  return Object.fromEntries(
    anchors.map((a, i) => [a, i === 0 ? defaults.map((t) => ({ ...t })) : []]),
  );
}

// Returns the empty task state for a given componentId
function defaultTasksFor(componentId) {
  if (componentId.startsWith("module-"))
    return buildTaskMap(MODULE_ANCHORS, MODULE_DEFAULTS);
  if (componentId.startsWith("rob3-"))
    return buildTaskMap(ROB3_ANCHORS, ROB3_DEFAULTS);
  if (componentId.startsWith("fpob-"))
    return buildTaskMap(FPOB_ANCHORS, FPOB_DEFAULTS);
  if (componentId.startsWith("rpob-"))
    return buildTaskMap(RPOB_ANCHORS, RPOB_DEFAULTS);
  return {};
}

// Interactive component IDs (for task state management).
// Derived from the placeable slots in placement.js so this list stays in
// sync with positions.json automatically: adding a slot there gives it a
// task state here without editing this file.
export const INTERACTIVE_IDS = ALL_PLACEABLE_SLOTS;

// Initiate the task state for the 4 variant
// Structure: { 0: { 'module-0': { base: [...] }, ... }, 1: {...}, 2: {...}, 3: {...} }
export function initAllTasks() {
  const result = {};
  for (let v = 0; v < 4; v++) {
    result[v] = {};
    for (const id of INTERACTIVE_IDS) {
      result[v][id] = defaultTasksFor(id);
    }
  }
  return result;
}
