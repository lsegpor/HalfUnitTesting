import { useRef, useState, useEffect, useCallback } from 'react'
import './App.css'
import Nodes from './components/Nodes'
import AdapterPlate from './components/AdapterPlate'
import ModuleTop from './components/ModuleTop'
import Rob3Top from './components/Rob3Top'
import FpobTop from './components/FpobTop'
import F3PlateTop from './components/F3PlateTop'
import CoolingPlate from './components/CoolingPlate'
import CableLayer from './components/CableLayer'
import RpobTop from './components/RpobTop'
import HVPlate from './components/HVPlate'
import { modalDraggingRef } from './scripts/modalDraggingRef'
import { initAllTasks, defaultCableTasks } from './scripts/taskState'
import { ROLE_LABELS, ROLES } from './scripts/roles'
import { PLACEABLE_TYPES, initPlacement } from './scripts/placement'
import positionsData from './scripts/positions.json'
import RoleSelectScreen from './components/RoleSelectScreen'
import html2canvas from 'html2canvas'

const MIN_SCALE = 0.3
const MAX_SCALE = 4
const ZOOM_STEP = 0.15

const PREDEFINED_CABLES = []

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT POSITIONS PER VARIANT
//
// Positions live in scripts/positions.json (one block per variant 0-3,
// keyed by componentId). Edit that file to adjust top/left/width or to
// add/remove slots; placement.js derives the placeable slots from it too.
// JSON keys are strings, so index POSITIONS by String(variant).
// ─────────────────────────────────────────────────────────────────────────────
const POSITIONS = positionsData

// ─────────────────────────────────────────────────────────────────────────────
// MIRROR CALIBRATION
//
// The mirrored perspectives (1 = top-right, 2 = bottom-left, 3 = bottom-right)
// are pre-mirrored in positions.json. The background (C-frame, adapters,
// f3plate, cooling) already lines up; only the PLACEABLE layer
// (modules/rob3/fpob/rpob, plus their ghost slots and remove badges) drifts
// by a constant amount in the mirrored views. Nudge that layer here.
//
//   x → applied to LEFT in horizontally-mirrored variants (1 and 3)
//   y → applied to TOP  in vertically-mirrored   variants (2 and 3)
//
// Positive x shifts placed components to the RIGHT; positive y shifts them DOWN.
// Variants 0 (top-left) is never adjusted. Tune live until aligned, then leave.
// ─────────────────────────────────────────────────────────────────────────────

const MODULE_OFFSET = {
  x: 0,
  y: 0,
}

const BLOCK_OFFSET = {
  x: 0,
  y: 0,
}

const ADAPTER_OFFSET = {
  x: 0,
  y: -13,
}

// Which variants are mirrored on each axis.
const H_MIRRORED = new Set([1, 3])  // left/right flipped
const V_MIRRORED = new Set([2, 3])  // top/bottom flipped

function getMirrorOffset(slotId) {
  if (slotId.startsWith('module-')) {
    return MODULE_OFFSET
  }

  if (
    slotId.startsWith('rob3-') ||
    slotId.startsWith('fpob-') ||
    slotId.startsWith('rpob-')
  ) {
    return BLOCK_OFFSET
  }

  if (slotId.startsWith('adapter-')) {
    return ADAPTER_OFFSET
  }

  return { x: 0, y: 0 }
}

const CANVAS_W = 600
const CANVAS_H = 715

function mirrorPosition(variant, pos) {
  if (!pos) return pos
  const v = Number(variant)
  const w = parseInt(pos.width)
  const h = parseInt(pos.height)
  let left = parseInt(pos.left)
  let top = parseInt(pos.top)

  if (H_MIRRORED.has(v)) left = CANVAS_W - left - w
  if (V_MIRRORED.has(v)) top = CANVAS_H - top - h

  return { ...pos, left: `${left}px`, top: `${top}px` }
}

// Applies the mirror calibration offset to a position object for a variant.
// Leaves width untouched; only nudges left/top by the constant offset.
function adjustForMirror(variant, slotId, pos) {
  if (!pos) return pos

  const v = Number(variant)

  const offset = getMirrorOffset(slotId)

  const dx = H_MIRRORED.has(v)
    ? offset.x
    : 0

  const dy = V_MIRRORED.has(v)
    ? offset.y
    : 0

  if (!dx && !dy) return pos

  return {
    ...pos,
    left: `${parseInt(pos.left) + dx}px`,
    top: `${parseInt(pos.top) + dy}px`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant selector
// ─────────────────────────────────────────────────────────────────────────────
const VARIANT_LABELS = ['Top-left', 'Top-right', 'Bottom-left', 'Bottom-right']
const MINI_TRANSFORMS = [
  '',
  'scale(-1,1) translate(-100,0)',
  'scale(1,-1) translate(0,-120)',
  'scale(-1,-1) translate(-100,-120)',
]

// Half-view groupings: LEFT stacks variants 0 (top) + 2 (bottom);
// RIGHT stacks variants 1 (top) + 3 (bottom). Pan/zoom is shared by
// both stacked canvases (one transform on the shared canvasRef wrapper).
const HALF_PAIRS = {
  left: { top: 0, bottom: 2, label: 'Left' },
  right: { top: 1, bottom: 3, label: 'Right' },
}

function VariantMiniature({ variant, selected, onClick }) {
  return (
    <button onClick={onClick} title={VARIANT_LABELS[variant]} style={{
      background: selected ? '#0d2233' : '#0d1017',
      border: selected ? '1px solid #00d4ff' : '1px solid #2a2f3a',
      boxShadow: selected ? '0 0 8px rgba(0,212,255,0.35)' : 'none',
      cursor: 'pointer', padding: 6,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      transition: 'border 0.15s, box-shadow 0.15s, background 0.15s',
    }}>
      <svg viewBox="-4 -4 108 128" xmlns="http://www.w3.org/2000/svg" width="52" height="62">
        <g transform={MINI_TRANSFORMS[variant]}>
          <path d="M 100,0 L 0,0 L 0,120 L 35,120 L 35,50 L 65,30 L 100,30 Z"
            fill={selected ? '#0a2a3f' : '#1a1f2a'}
            stroke={selected ? '#00d4ff' : '#4a5060'}
            strokeWidth="2" strokeLinejoin="round"
          />
        </g>
      </svg>
      <span style={{
        fontFamily: 'monospace', fontSize: 9,
        color: selected ? '#00d4ff' : '#4a5060',
        letterSpacing: 0.5, userSelect: 'none', textAlign: 'center', lineHeight: 1.3,
      }}>
        {VARIANT_LABELS[variant].toUpperCase()}
      </span>
    </button>
  )
}

// Half-view selector button: plain text label (LEFT / RIGHT), no drawing.
function HalfMiniature({ halfKey, selected, onClick }) {
  const { label } = HALF_PAIRS[halfKey]
  return (
    <button onClick={onClick} title={`${label} (top + bottom)`} style={{
      background: selected ? '#0d2233' : '#0d1017',
      border: selected ? '1px solid #00d4ff' : '1px solid #2a2f3a',
      boxShadow: selected ? '0 0 8px rgba(0,212,255,0.35)' : 'none',
      cursor: 'pointer', padding: '18px 6px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border 0.15s, box-shadow 0.15s, background 0.15s',
    }}>
      <span style={{
        fontFamily: 'monospace', fontSize: 11,
        color: selected ? '#00d4ff' : '#4a5060',
        letterSpacing: 1, userSelect: 'none', textAlign: 'center',
      }}>
        {label.toUpperCase()}
      </span>
    </button>
  )
}


// Maps a slot prefix to its React component and base z-index.
const SLOT_COMPONENTS = {
  module: { Comp: ModuleTop, zIndex: 3 },
  rob3: { Comp: Rob3Top, zIndex: 2 },
  fpob: { Comp: FpobTop, zIndex: 2 },
  rpob: { Comp: RpobTop, zIndex: 2 },
}

// Fixed ghost size overrides per type. When set, these replace the default
// width*0.18 height heuristic — useful for components like ROB3 whose real
// aspect ratio (~17.8:1) is much thinner than the generic ghost proportions.
// Add more entries here (e.g. fpob: { width: ..., height: ... }) as needed.
const GHOST_SIZE_OVERRIDES = {
  rob3: { width: 160, height: 15 },
}

// Empty-slot ghost: a clickable dashed outline shown only in placement mode
// for slots of the currently-selected type that are not yet placed.
function GhostSlot({ pos, type, label, onClick }) {
  const override = GHOST_SIZE_OVERRIDES[type]
  const widthPx = override ? override.width : parseInt(pos.width)
  const heightPx = override ? override.height : Math.max(14, Math.round(widthPx * 0.18))
  return (
    <div
      data-modal
      onClick={onClick}
      title={`Place ${label} here`}
      style={{
        position: 'absolute', top: pos.top, left: pos.left,
        width: widthPx, height: heightPx,
        zIndex: 50, cursor: 'pointer',
        border: '1.5px dashed #00d4ff',
        background: 'rgba(0,212,255,0.10)',
        boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#00d4ff', letterSpacing: 1, userSelect: 'none', pointerEvents: 'none' }}>
        +
      </span>
    </div>
  )
}

function ComponentCanvas({
  variant, role, tasks, onToggleTask, onAddTask, openModals, onOpenModal, onCloseModal,
  cables, onSetCables,
  cableTasks, onToggleCableTask, onAddCableTask,
  openCableModals, onOpenCableModal, onCloseCableModal,
  placed, placingType, onPlaceSlot, onRemoveSlot,
}) {
  const innerRef = useRef(null)
  // Raw per-variant positions from positions.json, wrapped so every lookup
  // (pos['module-0'], pos[slotId], …) gets the mirror calibration applied
  // automatically. Background pieces (adapters, f3plate, cooling, hv) already
  // align with the C-frame, so they are left untouched — only the placeable
  // layer (modules/rob3/fpob/rpob) and its ghosts/badges get nudged.
  const rawPos = POSITIONS[String(variant)]
  const pos = new Proxy(rawPos, {
    get: (target, key) => {
      if (key?.startsWith('hv-')) {
        return mirrorPosition(variant, POSITIONS['0'][key])
      }
      if (key?.startsWith('f3plate-') || key?.startsWith('cooling-')) {
        return target[key]
      }
      return adjustForMirror(variant, key, target[key])
    },
  })

  const placedMap = placed ? placed[variant] : null

  // Per-component mirroring: each component's own artwork (and any anchors
  // positioned in % inside it) is flipped via scaleX/scaleY to match the
  // orientation of the variant it's rendered in. This is independent from
  // adjustForMirror above, which only nudges block position — this flips
  // the component's internal geometry in place.
  const flipH = H_MIRRORED.has(variant)
  const flipV = V_MIRRORED.has(variant)

  // A slot is visible only when it has been placed for this variant.
  // When `placed` is undefined (e.g. export canvases) everything shows.
  function isPlaced(componentId) {
    return placedMap ? !!placedMap[componentId] : true
  }

  function makeHandlers(componentId) {
    return {
      tasks: tasks[variant][componentId],
      onToggleTask: (anchorId, idx) => onToggleTask(variant, componentId, anchorId, idx),
      onAddTask: (anchorId, text) => onAddTask(variant, componentId, anchorId, text),
      modalOpen: !!(openModals && openModals[variant] && openModals[variant][componentId]),
      onOpenModal: () => onOpenModal?.(variant, componentId),
      onCloseModal: () => onCloseModal?.(variant, componentId),
    }
  }

  // Build the list of placed components, grouped by type.
  const placedComponents = PLACEABLE_TYPES.flatMap(({ type, slots }) =>
    slots
      .filter(isPlaced)
      .map(slotId => {
        const { Comp, zIndex } = SLOT_COMPONENTS[type]
        const id = Number(slotId.split('-')[1])
        return (
          <Comp
            key={slotId}
            id={id}
            {...pos[slotId]}
            zIndex={zIndex}
            componentId={slotId}
            flipH={flipH}
            flipV={flipV}
            {...makeHandlers(slotId)}
          />
        )
      })
  )

  // Ghost slots: only the currently-selected type's empty slots, in
  // placement mode. Clicking one places the component into that slot.
  const ghostSlots = placingType
    ? PLACEABLE_TYPES
      .filter(t => t.type === placingType)
      .flatMap(({ type, slots, label }) =>
        slots
          .filter(slotId => !isPlaced(slotId))
          .map(slotId => (
            <GhostSlot
              key={`ghost-${slotId}`}
              pos={pos[slotId]}
              type={type}
              label={label}
              onClick={() => onPlaceSlot?.(variant, slotId)}
            />
          ))
      )
    : null

  // Remove badges: small ✕ on placed components whose type is currently
  // selected in the palette, letting the moderator un-place them.
  const removeBadges = placingType
    ? PLACEABLE_TYPES
      .filter(t => t.type === placingType)
      .flatMap(({ slots }) =>
        slots
          .filter(isPlaced)
          .map(slotId => {
            const p = pos[slotId]
            return (
              <div
                key={`rm-${slotId}`}
                data-modal
                onClick={() => onRemoveSlot?.(variant, slotId)}
                title="Remove component"
                style={{
                  position: 'absolute',
                  top: `calc(${p.top} - 6px)`,
                  left: `calc(${p.left} + ${parseInt(p.width)}px - 8px)`,
                  width: 14, height: 14, zIndex: 60, cursor: 'pointer',
                  background: '#1a1e28', border: '1px solid #ff5470',
                  color: '#ff5470', borderRadius: '50%',
                  fontFamily: 'monospace', fontSize: 9, lineHeight: '12px',
                  textAlign: 'center', userSelect: 'none',
                }}
              >
                ×
              </div>
            )
          })
      )
    : null

  return (
    <div ref={innerRef} style={{ position: 'relative', transform: 'translate(-50%, -50%)', width: '600px' }}>
      <Nodes variant={variant} />

      <AdapterPlate id={0} {...pos['adapter-0']} zIndex={2} componentId="adapter-0" flipH={flipH} flipV={flipV} />
      <AdapterPlate id={1} {...pos['adapter-1']} zIndex={2} componentId="adapter-1" flipH={flipH} flipV={flipV} />
      <AdapterPlate id={2} {...pos['adapter-2']} zIndex={2} componentId="adapter-2" flipH={flipH} flipV={flipV} />

      <F3PlateTop id={0} {...pos['f3plate-0']} zIndex={1} componentId="f3plate-0" flipH={flipH} flipV={flipV} />
      <CoolingPlate id={0} {...pos['cooling-0']} zIndex={1} componentId="cooling-0" flipH={flipH} flipV={flipV} />
      <HVPlate {...pos['hv-0']} zIndex={1} componentId="hv-0" flipH={flipH} flipV={flipV} />

      {placedComponents}
      {ghostSlots}
      {removeBadges}

      <CableLayer
        canvasRef={innerRef}
        cables={cables ? cables[variant] : PREDEFINED_CABLES}
        onSetCables={onSetCables ? (updater) => onSetCables(variant, updater) : undefined}
        variant={variant}
        role={role}
        flipH={flipH}
        flipV={flipV}
        cableTasks={cableTasks ? cableTasks[variant] : undefined}
        onToggleCableTask={onToggleCableTask ? (cableId, idx) => onToggleCableTask(variant, cableId, idx) : undefined}
        onAddCableTask={onAddCableTask ? (cableId, text) => onAddCableTask(variant, cableId, text) : undefined}
        openCableModals={openCableModals ? openCableModals[variant] : undefined}
        onOpenCableModal={onOpenCableModal ? (cableId) => onOpenCableModal(variant, cableId) : undefined}
        onCloseCableModal={onCloseCableModal ? (cableId) => onCloseCableModal(variant, cableId) : undefined}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// App principal
// ─────────────────────────────────────────────────────────────────────────────

// Toggles a task's done state, recording the exact completion time.
// Marking done stamps doneAt (ISO string); unchecking removes it, so a
// re-completed task gets a fresh timestamp.
function toggleWithTimestamp(task) {
  if (task.done) {
    // Unchecking: drop the timestamp so a re-completed task gets a fresh one.
    // The delete runs on a fresh copy, never on the state object itself.
    const updated = { ...task, done: false }
    delete updated.doneAt
    return updated
  }
  return { ...task, done: true, doneAt: new Date().toISOString() }
}

// Drops entries keyed by cable ids that no longer exist in the cable state.
// Returns the same reference when nothing changed, so setState bails out
// and no re-render loop is triggered.
function pruneByCableIds(state, cables) {
  let changed = false
  const next = {}
  for (const v of [0, 1, 2, 3]) {
    const ids = new Set((cables[v] || []).map(c => String(c.id)))
    const entries = Object.entries(state[v] || {})
    const kept = entries.filter(([id]) => ids.has(id))
    if (kept.length !== entries.length) changed = true
    next[v] = Object.fromEntries(kept)
  }
  return changed ? next : state
}

export default function App() {
  const viewportRef = useRef(null)
  const canvasRef = useRef(null)
  const exportRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]
  const [exporting, setExporting] = useState(false)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [variant, setVariant] = useState(0)

  // View mode: 'quadrant' shows one of the four orientations at a time.
  // 'half' shows two stacked orientations (top+bottom) sharing one pan/zoom,
  // grouped as LEFT (variants 0+2) or RIGHT (variants 1+3).
  const [viewMode, setViewMode] = useState('quadrant')
  const [half, setHalf] = useState('left')

  // Current user role: null until the user picks one on the entry screen.
  // No credentials for now (no database yet); per-role access rules will
  // be defined later in scripts/roles.js (PERMISSIONS + can()).
  const [role, setRole] = useState(null)

  // Task state: { [variant]: { [componentId]: { [anchorId]: [{text,done}] } } }
  const [tasks, setTasks] = useState(() => initAllTasks())

  // Modal open state: { [variant]: { [componentId]: bool } }
  // Keyed by variant so each orientation has its own independent modal visibility
  const [openModals, setOpenModals] = useState(() =>
    Object.fromEntries([0, 1, 2, 3].map(v => [v, {}]))
  )

  // Cable state: { [variant]: Cable[] }
  // Keyed by variant so each orientation has its own independent cable set
  const [cables, setCables] = useState(() =>
    Object.fromEntries([0, 1, 2, 3].map(v => [v, PREDEFINED_CABLES]))
  )

  // Placement state: { [variant]: { [componentId]: bool } }
  // The canvas starts empty (only background shown); the moderator places
  // components into fixed slots. Placement is independent per orientation.
  const [placed, setPlaced] = useState(() => initPlacement())

  // Currently-selected placeable type in the palette (moderator only), or
  // null when not placing. While set, empty slots of that type show as ghosts.
  const [placingType, setPlacingType] = useState(null)

  // Places a component into a slot for the given variant.
  function handlePlaceSlot(v, slotId) {
    setPlaced(prev => ({
      ...prev,
      [v]: { ...prev[v], [slotId]: true }
    }))
  }

  // Removes a placed component from a slot for the given variant.
  function handleRemoveSlot(v, slotId) {
    setPlaced(prev => ({
      ...prev,
      [v]: { ...prev[v], [slotId]: false }
    }))
    // Also close its modal if open
    setOpenModals(prev => ({
      ...prev,
      [v]: { ...prev[v], [slotId]: false }
    }))
  }

  // Cable task state: { [variant]: { [cableId]: [{text,done}] } }
  // Cables are created dynamically, so a cable's task list is initialized
  // lazily (with defaultCableTasks) the first time its modal opens.
  const [cableTasks, setCableTasks] = useState(() =>
    Object.fromEntries([0, 1, 2, 3].map(v => [v, {}]))
  )

  // Cable modal open state: { [variant]: { [cableId]: bool } }
  const [openCableModals, setOpenCableModals] = useState(() =>
    Object.fromEntries([0, 1, 2, 3].map(v => [v, {}]))
  )

  function handleToggleCableTask(v, cableId, idx) {
    setCableTasks(prev => {
      const list = [...(prev[v][cableId] || [])]
      list[idx] = toggleWithTimestamp(list[idx])
      return { ...prev, [v]: { ...prev[v], [cableId]: list } }
    })
  }

  function handleAddCableTask(v, cableId, text) {
    setCableTasks(prev => {
      const list = [...(prev[v][cableId] || []), { text, done: false }]
      return { ...prev, [v]: { ...prev[v], [cableId]: list } }
    })
  }

  function handleOpenCableModal(v, cableId) {
    // Initialize the cable's task list with defaults on first open
    setCableTasks(prev =>
      prev[v][cableId]
        ? prev
        : { ...prev, [v]: { ...prev[v], [cableId]: defaultCableTasks() } }
    )
    setOpenCableModals(prev => ({
      ...prev,
      [v]: { ...prev[v], [cableId]: true }
    }))
  }

  function handleCloseCableModal(v, cableId) {
    setOpenCableModals(prev => ({
      ...prev,
      [v]: { ...prev[v], [cableId]: false }
    }))
  }

  function handleSetCables(v, updater) {
    // Compute the next cable list here so the related state (cable tasks,
    // open cable modals) can be pruned in the same event handler. All three
    // setState calls are batched into a single render — no syncing effect,
    // no cascading renders.
    const nextList = typeof updater === 'function' ? updater(cables[v]) : updater
    const nextCables = { ...cables, [v]: nextList }
    setCables(nextCables)
    setCableTasks(prev => pruneByCableIds(prev, nextCables))
    setOpenCableModals(prev => pruneByCableIds(prev, nextCables))
  }

  function handleOpenModal(v, componentId) {
    setOpenModals(prev => ({
      ...prev,
      [v]: { ...prev[v], [componentId]: true }
    }))
  }

  function handleCloseModal(v, componentId) {
    setOpenModals(prev => ({
      ...prev,
      [v]: { ...prev[v], [componentId]: false }
    }))
  }

  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const stateRef = useRef({ scale: 1, offset: { x: 0, y: 0 } })

  useEffect(() => { stateRef.current = { scale, offset } }, [scale, offset])

  const applyTransform = useCallback((s, ox, oy) => {
    if (canvasRef.current)
      canvasRef.current.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`
  }, [])

  function handleToggleTask(v, componentId, anchorId, idx) {
    setTasks(prev => {
      const list = [...prev[v][componentId][anchorId]]
      list[idx] = toggleWithTimestamp(list[idx])
      return {
        ...prev,
        [v]: { ...prev[v], [componentId]: { ...prev[v][componentId], [anchorId]: list } }
      }
    })
  }

  function handleAddTask(v, componentId, anchorId, text) {
    setTasks(prev => {
      const list = [...(prev[v][componentId][anchorId] || []), { text, done: false }]
      return {
        ...prev,
        [v]: { ...prev[v], [componentId]: { ...prev[v][componentId], [anchorId]: list } }
      }
    })
  }

  // Wheel zoom
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    function onWheel(e) {
      e.preventDefault()
      const { scale: s, offset: o } = stateRef.current
      const rect = vp.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const delta = e.deltaY < 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * delta))
      const ratio = newScale / s
      const newOx = mouseX - ratio * (mouseX - o.x)
      const newOy = mouseY - ratio * (mouseY - o.y)
      stateRef.current = { scale: newScale, offset: { x: newOx, y: newOy } }
      setScale(newScale)
      setOffset({ x: newOx, y: newOy })
      applyTransform(newScale, newOx, newOy)
    }
    vp.addEventListener('wheel', onWheel, { passive: false })
    return () => vp.removeEventListener('wheel', onWheel)
  }, [applyTransform])

  // Arrastrar con ratón
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    function onMouseDown(e) {
      if (e.button !== 0) return
      if (modalDraggingRef.current) return
      if (e.target.closest('[data-modal]')) return
      dragging.current = true
      lastPos.current = { x: e.clientX, y: e.clientY }
      vp.style.cursor = 'grabbing'
    }
    function onMouseMove(e) {
      if (!dragging.current) return
      if (modalDraggingRef.current) { dragging.current = false; vp.style.cursor = 'grab'; return }
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
      const { scale: s, offset: o } = stateRef.current
      const newOx = o.x + dx
      const newOy = o.y + dy
      stateRef.current = { scale: s, offset: { x: newOx, y: newOy } }
      applyTransform(s, newOx, newOy)
    }
    function onMouseUp() {
      if (!dragging.current) return
      dragging.current = false
      vp.style.cursor = 'grab'
      setOffset({ ...stateRef.current.offset })
    }
    vp.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      vp.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [applyTransform])

  // Pellizco táctil
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    let lastTouchDist = null
    function getTouchDist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) }
    function getTouchMid(t) { return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 } }
    function onTouchStart(e) {
      if (e.touches.length === 2) lastTouchDist = getTouchDist(e.touches)
      else if (e.touches.length === 1) { lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; dragging.current = true }
    }
    function onTouchMove(e) {
      e.preventDefault()
      const { scale: s, offset: o } = stateRef.current
      if (e.touches.length === 2) {
        const dist = getTouchDist(e.touches)
        const mid = getTouchMid(e.touches)
        const rect = vp.getBoundingClientRect()
        const ratio = dist / (lastTouchDist || dist)
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * ratio))
        const mx = mid.x - rect.left; const my = mid.y - rect.top
        const r = newScale / s
        stateRef.current = { scale: newScale, offset: { x: mx - r * (mx - o.x), y: my - r * (my - o.y) } }
        applyTransform(newScale, stateRef.current.offset.x, stateRef.current.offset.y)
        lastTouchDist = dist
      } else if (e.touches.length === 1 && dragging.current) {
        const dx = e.touches[0].clientX - lastPos.current.x
        const dy = e.touches[0].clientY - lastPos.current.y
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        stateRef.current = { scale: s, offset: { x: o.x + dx, y: o.y + dy } }
        applyTransform(s, stateRef.current.offset.x, stateRef.current.offset.y)
      }
    }
    function onTouchEnd() {
      dragging.current = false; lastTouchDist = null
      setScale(stateRef.current.scale); setOffset({ ...stateRef.current.offset })
    }
    vp.addEventListener('touchstart', onTouchStart, { passive: true })
    vp.addEventListener('touchmove', onTouchMove, { passive: false })
    vp.addEventListener('touchend', onTouchEnd)
    return () => {
      vp.removeEventListener('touchstart', onTouchStart)
      vp.removeEventListener('touchmove', onTouchMove)
      vp.removeEventListener('touchend', onTouchEnd)
    }
  }, [applyTransform])

  function zoomIn() { zoom(1 + ZOOM_STEP) }
  function zoomOut() { zoom(1 - ZOOM_STEP) }
  function zoom(delta) {
    const { scale: s, offset: o } = stateRef.current
    const vp = viewportRef.current
    const cx = vp ? vp.clientWidth / 2 : 0
    const cy = vp ? vp.clientHeight / 2 : 0
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * delta))
    const ratio = newScale / s
    const newOx = cx - ratio * (cx - o.x)
    const newOy = cy - ratio * (cy - o.y)
    stateRef.current = { scale: newScale, offset: { x: newOx, y: newOy } }
    setScale(newScale); setOffset({ x: newOx, y: newOy })
    applyTransform(newScale, newOx, newOy)
  }
  function resetView() {
    stateRef.current = { scale: 1, offset: { x: 0, y: 0 } }
    setScale(1); setOffset({ x: 0, y: 0 }); applyTransform(1, 0, 0)
  }

  async function exportAllVariants() {
    setExporting(true)
    try {
      // Mount the hidden export canvases, then wait a few frames. CableLayer
      // measures cable endpoint positions from the DOM at render time and
      // repaints itself via requestAnimationFrame once its layout settles, so
      // a couple of frames is enough for the cables to be drawn before capture.
      await new Promise(r => requestAnimationFrame(() =>
        requestAnimationFrame(() => requestAnimationFrame(r))))

      const canvases = await Promise.all(
        exportRefs.map(ref =>
          html2canvas(ref.current, {
            backgroundColor: '#f5f5f0',
            scale: 2,
            useCORS: true,
            logging: false,
          })
        )
      )

      // Layout: [v2 top-left] [v3 top-right]
      //         [v0 bot-left] [v1 bot-right]
      // exportRefs order: [0]=v2, [1]=v3, [2]=v0, [3]=v1
      const W = canvases[0].width
      const H = canvases[0].height
      const GAP = 8 * 2   // 8px gap, scaled x2
      const PAD = 16 * 2  // 16px padding, scaled x2

      const out = document.createElement('canvas')
      out.width = W * 2 + GAP + PAD * 2
      out.height = H * 2 + GAP + PAD * 2
      const ctx = out.getContext('2d')

      // Background
      ctx.fillStyle = '#1a1e28'
      ctx.fillRect(0, 0, out.width, out.height)

      // Draw the 4 quadrants: order matches exportRefs
      // exportRefs: [0]=v2, [1]=v3, [2]=v0, [3]=v1
      // Desired layout: v0/v1 on top row, v2/v3 on bottom row
      const positions = [
        { x: PAD, y: PAD + H + GAP },  // bot-left  → v2
        { x: PAD + W + GAP, y: PAD + H + GAP },  // bot-right → v3
        { x: PAD, y: PAD },             // top-left  → v0
        { x: PAD + W + GAP, y: PAD },             // top-right → v1
      ]
      canvases.forEach((c, i) => ctx.drawImage(c, positions[i].x, positions[i].y))

      // Label each quadrant
      ctx.font = `bold ${14 * 2}px monospace`
      ctx.fillStyle = 'rgba(0,212,255,0.7)'
      const labels = ['TOP-LEFT', 'TOP-RIGHT', 'BOT-LEFT', 'BOT-RIGHT']
      positions.forEach(({ x, y }, i) => {
        ctx.fillText(labels[i], x + 8, y + 24)
      })

      // Download
      const link = document.createElement('a')
      link.download = 'half-unit-4views.png'
      link.href = out.toDataURL('image/png')
      link.click()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: '#111' }}>

      {/* Role selection screen: shown as an opaque layer until a role is picked.
          Rendered as an overlay (not an early return) so the viewport stays
          mounted and its wheel/drag/touch listeners attach normally. */}
      {!role && <RoleSelectScreen onSelectRole={setRole} />}

      {/* Current user badge */}
      {role && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 600,
          background: '#0d1017', border: '1px solid #2a2f3a',
          padding: '8px 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a4050', letterSpacing: 1, userSelect: 'none' }}>
            USER
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#00d4ff', letterSpacing: 1.5, userSelect: 'none' }}>
            {ROLE_LABELS[role].toUpperCase()}
          </span>
          <div style={{ width: 1, height: 18, background: '#2a2f3a' }} />
          <button
            onClick={() => { setRole(null); setPlacingType(null) }}
            title="Switch user type"
            style={{ ...btnStyle, fontSize: 9, letterSpacing: 1, padding: '4px 8px', width: 'auto' }}
          >
            SWITCH
          </button>
        </div>
      )}

      {/* Orientation selector. Two modes:
          - QUADRANT: pick one of the four orientations, shown alone.
          - HALF: pick LEFT or RIGHT, showing that side's top+bottom
            orientations stacked together under one shared pan/zoom. */}
      <div style={{
        position: 'fixed', top: 16, left: 16, zIndex: 600,
        background: '#0d1017', border: '1px solid #2a2f3a',
        padding: '10px 10px 8px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a4050', letterSpacing: 1, userSelect: 'none' }}>
            {viewMode === 'quadrant' ? 'ORIENTATION' : 'HALF VIEW'}
          </span>
          <div style={{ display: 'flex', border: '1px solid #2a2f3a' }}>
            <button
              onClick={() => setViewMode('quadrant')}
              title="Show one quadrant at a time"
              style={{
                background: viewMode === 'quadrant' ? '#0d2233' : 'none',
                color: viewMode === 'quadrant' ? '#00d4ff' : '#4a5060',
                border: 'none', fontFamily: 'monospace', fontSize: 8,
                letterSpacing: 0.5, padding: '3px 6px', cursor: 'pointer',
              }}
            >
              4-UP
            </button>
            <button
              onClick={() => setViewMode('half')}
              title="Show two stacked orientations (top+bottom) at once"
              style={{
                background: viewMode === 'half' ? '#0d2233' : 'none',
                color: viewMode === 'half' ? '#00d4ff' : '#4a5060',
                border: 'none', borderLeft: '1px solid #2a2f3a',
                fontFamily: 'monospace', fontSize: 8,
                letterSpacing: 0.5, padding: '3px 6px', cursor: 'pointer',
              }}
            >
              2-UP
            </button>
          </div>
        </div>

        {viewMode === 'quadrant' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <VariantMiniature variant={0} selected={variant === 0} onClick={() => setVariant(0)} />
              <VariantMiniature variant={1} selected={variant === 1} onClick={() => setVariant(1)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <VariantMiniature variant={2} selected={variant === 2} onClick={() => setVariant(2)} />
              <VariantMiniature variant={3} selected={variant === 3} onClick={() => setVariant(3)} />
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <HalfMiniature halfKey="left" selected={half === 'left'} onClick={() => setHalf('left')} />
            <HalfMiniature halfKey="right" selected={half === 'right'} onClick={() => setHalf('right')} />
          </div>
        )}
      </div>

      {/* Placement palette (moderator only). Pick a component type, then
          click an empty slot on the canvas to place it. */}
      {role === ROLES.MODERATOR && (
        <div style={{
          position: 'fixed', top: 64, right: 16, zIndex: 600,
          background: '#0d1017', border: '1px solid #2a2f3a',
          padding: '10px 10px 8px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', gap: 6, width: 150,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#3a4050', letterSpacing: 1, userSelect: 'none', marginBottom: 2 }}>
            PLACE COMPONENTS
          </span>
          {PLACEABLE_TYPES.map(({ type, label, slots }) => {
            const activeVariants = viewMode === 'half' ? [HALF_PAIRS[half].top, HALF_PAIRS[half].bottom] : [variant]
            const placedCount = activeVariants.reduce(
              (sum, v) => sum + slots.filter(s => placed[v][s]).length, 0
            )
            const totalSlots = slots.length * activeVariants.length
            const active = placingType === type
            return (
              <button
                key={type}
                onClick={() => setPlacingType(active ? null : type)}
                style={{
                  background: active ? '#0d2233' : '#0d1017',
                  border: active ? '1px solid #00d4ff' : '1px solid #2a2f3a',
                  boxShadow: active ? '0 0 8px rgba(0,212,255,0.35)' : 'none',
                  color: active ? '#00d4ff' : '#e8ecf4',
                  fontFamily: 'monospace', fontSize: 11, letterSpacing: 1,
                  padding: '6px 8px', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'border 0.15s, box-shadow 0.15s, background 0.15s',
                }}
              >
                <span>{label.toUpperCase()}</span>
                <span style={{ fontSize: 9, color: '#3a4050' }}>
                  {placedCount}/{totalSlots}
                </span>
              </button>
            )
          })}
          {placingType && (
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#00d4ff', letterSpacing: 0.5, lineHeight: 1.4, userSelect: 'none' }}>
              Click a + slot to place. Click the type again to stop.
            </span>
          )}
          <button
            onClick={() => {
              const activeVariants = viewMode === 'half' ? [HALF_PAIRS[half].top, HALF_PAIRS[half].bottom] : [variant]
              setPlaced(prev => {
                const next = { ...prev }
                for (const v of activeVariants) {
                  next[v] = Object.fromEntries(Object.keys(prev[v]).map(k => [k, false]))
                }
                return next
              })
            }}
            style={{ ...btnStyle, fontSize: 9, letterSpacing: 1, padding: '4px 8px', width: 'auto', marginTop: 2 }}
          >
            {viewMode === 'half' ? 'CLEAR BOTH' : 'CLEAR THIS VIEW'}
          </button>
        </div>
      )}

      {/* Zoom controls */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 500,
        display: 'flex', alignItems: 'center', gap: 6,
        background: '#0d1017', border: '1px solid #2a2f3a',
        padding: '6px 10px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}>
        <button onClick={zoomOut} style={btnStyle}>−</button>
        <span onClick={resetView} style={{ fontFamily: 'monospace', fontSize: 11, color: '#00d4ff', minWidth: 38, textAlign: 'center', cursor: 'pointer', letterSpacing: 1, userSelect: 'none' }}>
          {Math.round(scale * 100)}%
        </span>
        <button onClick={zoomIn} style={btnStyle}>+</button>
        <div style={{ width: 1, height: 18, background: '#2a2f3a', margin: '0 4px' }} />
        <button onClick={resetView} style={{ ...btnStyle, fontSize: 10, letterSpacing: 1, padding: '4px 8px' }}>RESET</button>
        <div style={{ width: 1, height: 18, background: '#2a2f3a', margin: '0 4px' }} />
        <button
          onClick={exportAllVariants}
          disabled={exporting}
          style={{
            ...btnStyle,
            fontSize: 9,
            letterSpacing: 1,
            padding: '4px 8px',
            width: 'auto',
            color: exporting ? '#3a4050' : '#00d4ff',
            borderColor: exporting ? '#2a2f3a' : '#00d4ff',
          }}
        >
          {exporting ? 'EXPORTING…' : '⊞ EXPORT 4-VIEW'}
        </button>
      </div>

      <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 500, fontFamily: 'monospace', fontSize: 10, color: '#3a4050', letterSpacing: 1, userSelect: 'none' }}>
        SCROLL: ZOOM · DRAG: PAN
      </div>

      {/* Hidden off-screen canvases for 4-view export */}
      {/* Order: [0]=v2, [1]=v3, [2]=v0, [3]=v1  →  top-left, top-right, bot-left, bot-right */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', pointerEvents: 'none', zIndex: -1 }}>
        {[2, 3, 0, 1].map((v, i) => (
          <div
            key={v}
            ref={exportRefs[i]}
            style={{ position: 'relative', width: '620px', height: '720px', background: '#f5f5f0', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: '50%', left: '50%' }}>
              <ComponentCanvas
                variant={v}
                role={role}
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                cables={cables}
                onSetCables={handleSetCables}
                placed={placed}
                placingType={null}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Viewport */}
      <div ref={viewportRef} style={{ width: '100%', height: '100%', cursor: 'grab', overflow: 'hidden', position: 'relative' }}>
        <div ref={canvasRef} style={{
          position: 'absolute', top: '50%', left: '50%',
          transformOrigin: '0 0',
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          willChange: 'transform',
        }}>
          {viewMode === 'quadrant' ? (
            <ComponentCanvas
              variant={variant}
              role={role}
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              openModals={openModals}
              onOpenModal={handleOpenModal}
              onCloseModal={handleCloseModal}
              cables={cables}
              onSetCables={handleSetCables}
              cableTasks={cableTasks}
              onToggleCableTask={handleToggleCableTask}
              onAddCableTask={handleAddCableTask}
              openCableModals={openCableModals}
              onOpenCableModal={handleOpenCableModal}
              onCloseCableModal={handleCloseCableModal}
              placed={placed}
              placingType={role === ROLES.MODERATOR ? placingType : null}
              onPlaceSlot={handlePlaceSlot}
              onRemoveSlot={handleRemoveSlot}
            />
          ) : (
            // Half mode: top + bottom orientations of the chosen side,
            // stacked under the single shared pan/zoom transform above.
            // Each slot is a fixed-size relative box so ComponentCanvas's
            // internal translate(-50%,-50%) centers correctly within it.
            <div style={{ position: 'relative', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column' }}>
              {[HALF_PAIRS[half].top, HALF_PAIRS[half].bottom].map(v => (
                <div key={v} style={{ position: 'relative', width: '600px', height: '700px' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%' }}>
                    <ComponentCanvas
                      variant={v}
                      role={role}
                      tasks={tasks}
                      onToggleTask={handleToggleTask}
                      onAddTask={handleAddTask}
                      openModals={openModals}
                      onOpenModal={handleOpenModal}
                      onCloseModal={handleCloseModal}
                      cables={cables}
                      onSetCables={handleSetCables}
                      cableTasks={cableTasks}
                      onToggleCableTask={handleToggleCableTask}
                      onAddCableTask={handleAddCableTask}
                      openCableModals={openCableModals}
                      onOpenCableModal={handleOpenCableModal}
                      onCloseCableModal={handleCloseCableModal}
                      placed={placed}
                      placingType={role === ROLES.MODERATOR ? placingType : null}
                      onPlaceSlot={handlePlaceSlot}
                      onRemoveSlot={handleRemoveSlot}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const btnStyle = {
  background: 'none', border: '1px solid #2a2f3a', color: '#e8ecf4',
  fontFamily: 'monospace', fontSize: 16, width: 28, height: 28,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', lineHeight: 1, padding: 0, flexShrink: 0,
}