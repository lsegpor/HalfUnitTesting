// Module sizes available for ladder modules, in millimeters.
export const MODULE_SIZES_MM = [22, 42, 64, 122];

// Ladder ids present on each side of the C-frame.
export const LADDER_IDS = ["ladder-0", "ladder-1", "ladder-2"];

// Physical sides: LEFT and RIGHT are different physical ladders. Top and
// bottom orientations of the SAME side (0+2, 1+3) share the same ladder —
// only left vs right differ.
export const SIDES = ["left", "right"];

// Maps a variant (0-3) to its physical side.
// HALF_PAIRS in App.jsx: left = {top:0, bottom:2}, right = {top:1, bottom:3}.
export function sideForVariant(variant) {
  return [1, 3].includes(Number(variant)) ? "right" : "left";
}

// Per-side, per-ladder module configuration.
// `count`   = total modules on the FULL ladder (both halves of the full unit).
// `sizesMm` = sizes for the HALF shown here (count/2 entries), ordered from
//             the ladder's center (index 0) to the C-frame end (last index).
export function initLadderModules() {
  return Object.fromEntries(
    SIDES.map((side) => [
      side,
      Object.fromEntries(
        LADDER_IDS.map((id) => [id, { count: 0, sizesMm: [] }]),
      ),
    ]),
  );
}

// Resizes sizesMm to match a new total count, keeping existing entries and
// padding new slots with the smallest available size.
export function resizeSizes(sizesMm, newCount) {
  const visibleCount = Math.max(0, Math.floor(newCount / 2));
  const next = sizesMm.slice(0, visibleCount);
  while (next.length < visibleCount) next.push(MODULE_SIZES_MM[0]);
  return next;
}
