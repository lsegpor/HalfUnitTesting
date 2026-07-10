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
      { id: "dataConn0", label: "Data Conn 0", xPct: 97, yPct: 12 },
      { id: "dataConn1", label: "Data Conn 1", xPct: 97, yPct: 52 },
      { id: "hvConn0", label: "HV Conn 0", xPct: 6, yPct: 10 },
      { id: "hvConn1", label: "HV Conn 1", xPct: 6, yPct: 54 },
      { id: "powerConn0", label: "Power Conn 0", xPct: 2, yPct: 35 },
    ],
  },
  rob3: {
    label: "ROB3",
    img: rob3Img,
    imgAspect: 792.7 / 44.5,
    anchors: [{ id: "base", label: "Base", xPct: 81, yPct: 40 }],
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
    anchors: [{ id: "center", label: "Center", xPct: 50, yPct: 50 }],
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
