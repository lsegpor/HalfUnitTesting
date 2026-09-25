// Central registry of predefined connection anchors per component family,
// used by the Precise Connection modal (zoomed dual-component cable picker).
//
// This intentionally DUPLICATES the `ANCHORS` arrays already declared inside
// each component file (ModuleTop.jsx, Rob3Top.jsx, FpobTop.jsx, RpobTop.jsx)
// rather than importing them, because those constants are not exported from
// their files. If you ever add/move an anchor in one of those components,
// mirror the change here too — keep both in sync.
//
// `hv` has no per-anchor geometry (HVPlate renders a plain block with no
// ANCHORS array), so it gets a single synthetic "center" anchor.

import moduleImg from "../assets/moduletop.png";
import rob3Img from "../assets/rob3top.png";
import fpobImg from "../assets/fpobtop.png";
import rpobImg from "../assets/rpob.jpg";

export const ANCHOR_REGISTRY = {
  module: {
    label: "Module",
    img: moduleImg,
    imgAspect: 285.7 / 55.8,
    anchors: [
      { id: "dataConnPside", label: "Data Conn P-Side", xPct: 97, yPct: 12 },
      { id: "dataConnNside", label: "Data Conn N-Side", xPct: 97, yPct: 52 },
      { id: "hvConn0", label: "HV Conn 0", xPct: 6, yPct: 10 },
      { id: "hvConn1", label: "HV Conn 1", xPct: 6, yPct: 54 },
      { id: "powerConn0", label: "Power Conn 0", xPct: 2, yPct: 35 },
    ],
  },
  rob3: {
    label: "ROB3",
    img: rob3Img,
    imgAspect: 792.7 / 44.5,
    anchors: [
      { id: "dataConn0", label: "Data Conn 0", xPct: 77, yPct: 20 },
      { id: "dataConn1", label: "Data Conn 1", xPct: 85, yPct: 20 },
      { id: "dataConn2", label: "Data Conn 2", xPct: 81, yPct: 65 },
      { id: "dataConn3", label: "Data Conn 3", xPct: 91, yPct: 65 },
      { id: "dataConn4", label: "Data Conn 4", xPct: 98, yPct: 65 },
    ],
  },
  fpob: {
    label: "FPOB",
    img: fpobImg,
    imgAspect: 618.52 / 92.126,
    anchors: [
      { id: "conn0", label: "Conn 0", xPct: 88, yPct: 15 },
      { id: "conn1", label: "Conn 1", xPct: 88, yPct: 39 },
      { id: "conn2", label: "Conn 2", xPct: 88, yPct: 63 },
      { id: "conn3", label: "Conn 3", xPct: 88, yPct: 87 },
    ],
  },
  rpob: {
    label: "RPOB",
    img: rpobImg,
    imgAspect: 780 / 126,
    anchors: [{ id: "component", label: "RPOB", xPct: 50, yPct: 50 }],
  },
  hv: {
    label: "HV",
    img: null, // plain rendered block, no artwork
    imgAspect: 2, // matches HVPlate's default 40x20 ratio
    anchors: [
      { id: "hv00", label: "HV 00", xPct: 7, yPct: 30 },
      { id: "hv01", label: "HV 01", xPct: 13, yPct: 30 },
      { id: "hv02", label: "HV 02", xPct: 19, yPct: 30 },
      { id: "hv03", label: "HV 03", xPct: 25, yPct: 30 },
      { id: "hv04", label: "HV 04", xPct: 31, yPct: 30 },
      { id: "hv05", label: "HV 05", xPct: 37, yPct: 30 },
      { id: "hv06", label: "HV 06", xPct: 43, yPct: 30 },
      { id: "hv07", label: "HV 07", xPct: 49, yPct: 30 },
      { id: "hv08", label: "HV 08", xPct: 55, yPct: 30 },
      { id: "hv09", label: "HV 09", xPct: 61, yPct: 30 },
      { id: "hv10", label: "HV 10", xPct: 67, yPct: 30 },
      { id: "hv11", label: "HV 11", xPct: 73, yPct: 30 },
      { id: "hv12", label: "HV 12", xPct: 79, yPct: 30 },
      { id: "hv13", label: "HV 13", xPct: 85, yPct: 30 },
      { id: "hv14", label: "HV 14", xPct: 91, yPct: 30 },
      { id: "hv15", label: "HV 15", xPct: 7, yPct: 70 },
      { id: "hv16", label: "HV 16", xPct: 13, yPct: 70 },
      { id: "hv17", label: "HV 17", xPct: 19, yPct: 70 },
      { id: "hv18", label: "HV 18", xPct: 25, yPct: 70 },
      { id: "hv19", label: "HV 19", xPct: 31, yPct: 70 },
      { id: "hv20", label: "HV 20", xPct: 37, yPct: 70 },
      { id: "hv21", label: "HV 21", xPct: 43, yPct: 70 },
      { id: "hv22", label: "HV 22", xPct: 49, yPct: 70 },
      { id: "hv23", label: "HV 23", xPct: 55, yPct: 70 },
      { id: "hv24", label: "HV 24", xPct: 61, yPct: 70 },
      { id: "hv25", label: "HV 25", xPct: 67, yPct: 70 },
      { id: "hv26", label: "HV 26", xPct: 73, yPct: 70 },
      { id: "hv27", label: "HV 27", xPct: 79, yPct: 70 },
      { id: "hv28", label: "HV 28", xPct: 85, yPct: 70 },
      { id: "hv29", label: "HV 29", xPct: 91, yPct: 70 },
    ],
  },
};

// "module-3" → "module", "rpob-0" → "rpob", "hv-0" → "hv"
export function componentFamily(componentId) {
  return String(componentId).split("-")[0];
}

export function getAnchorsFor(componentId) {
  const family = componentFamily(componentId);
  return ANCHOR_REGISTRY[family]?.anchors ?? [];
}

export function getRegistryEntry(componentId) {
  const family = componentFamily(componentId);
  return ANCHOR_REGISTRY[family] ?? null;
}
