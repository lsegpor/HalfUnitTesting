import { useEffect, useLayoutEffect, useState } from 'react'
import { can } from '../scripts/roles'
import TaskModal from './TaskModal'
import PreciseConnectionModal from './PreciseConnectionModal'
import { getRegistryEntry } from '../scripts/anchorRegistry'

const CABLE_COLORS = {
  data: '#3b82f6',  // blue
  power: '#7c4a14', // brown
  hv: '#9ca3af',    // gray (HV is physically white; gray reads on the white C-frame)
}

// Connection rules: each cable type may only join these two component families
// (in either direction). Family is derived from the component id prefix.
const CABLE_RULES = {
  data: ['module', 'rob3'],
  power: ['module', 'fpob'],
  hv: ['module', 'hv'],
}

// "module-3" → "module", "rpob-0" → "rpob"
function componentFamily(componentId) {
  return String(componentId).split('-')[0]
}

// True when a cable of `type` is allowed between the two component families.
// Requires one endpoint from each side of the rule (no module→module, etc.).
function isConnectionAllowed(type, fromId, toId) {
  const rule = CABLE_RULES[type]
  if (!rule) return false
  const a = componentFamily(fromId)
  const b = componentFamily(toId)
  const [x, y] = rule
  return (a === x && b === y) || (a === y && b === x)
}

function bezierPath(p1, p2) {
  const span = Math.abs(p2.x - p1.x) * 0.5 + 30
  const dir1 = p1.dir ?? (p2.x >= p1.x ? 1 : -1)
  const dir2 = p2.dir ?? (p1.x >= p2.x ? 1 : -1)
  const c1x = p1.x + dir1 * span
  const c2x = p2.x + dir2 * span
  return `M ${p1.x},${p1.y} C ${c1x},${p1.y} ${c2x},${p2.y} ${p2.x},${p2.y}`
}

// Human-readable label for a cable, e.g. "data: rob3-0 → fpob-1"
function cableLabel(cable) {
  return `${cable.type}: ${cable.from.componentId} → ${cable.to.componentId}`
}

// Stable string key for an endpoint, used to cache its measured position.
function endpointKey(endpoint) {
  return `${endpoint.componentId}::${endpoint.anchorId ?? ''}`
}

// Returns the center position of an element relative to a given ancestor,
// walking the offsetParent chain — unaffected by CSS scale/zoom transforms.
//
// `flipHost`, when given, is the component wrapper (the element carrying
// data-component-id) that may itself be mirrored via CSS scaleX/scaleY (see
// ComponentCanvas's flipH/flipV). offsetLeft/offsetTop are layout values and
// are NOT affected by `transform` per spec, so a child anchor positioned at
// e.g. left:28% still reports its pre-flip offset even though it paints
// mirrored on screen. We correct for that by reflecting the anchor's offset
// *within flipHost's own box* before adding flipHost's own offset and
// continuing the walk upward — flipHost's own position relative to ITS
// parent is unaffected by its own transform, so only the inner step needs
// correcting. When el === flipHost (no anchor, measuring the component's own
// center) no correction is needed: a box's own center is invariant under
// scaleX(-1)/scaleY(-1) about that same box.
function getOffsetCenter(el, ancestor, flipHost, flipH, flipV) {
  let x, y, cur

  if (flipHost && el !== flipHost) {
    // Local position of el within flipHost's box, reflected if mirrored.
    x = el.offsetLeft + el.offsetWidth / 2
    y = el.offsetTop + el.offsetHeight / 2
    if (flipH) x = flipHost.offsetWidth - x
    if (flipV) y = flipHost.offsetHeight - y
    cur = flipHost
  } else {
    x = el.offsetWidth / 2
    y = el.offsetHeight / 2
    cur = el
  }

  while (cur && cur !== ancestor) {
    x += cur.offsetLeft
    y += cur.offsetTop
    cur = cur.offsetParent
  }
  return { x, y }
}

function getInnerEdgeX(el, canvas) {
  let left = el.offsetLeft
  let width = el.offsetWidth
  let cur = el.offsetParent
  while (cur && cur !== canvas) {
    left += cur.offsetLeft
    cur = cur.offsetParent
  }
  const center = left + width / 2
  const canvasMid = canvas.offsetWidth / 2
  return center < canvasMid
    ? { x: left + width, dir: 1 }
    : { x: left, dir: -1 }
}

function resolveEndpointPos(canvas, endpoint, flipH, flipV) {
  if (!canvas || !endpoint) return null
  const el = canvas.querySelector(`[data-component-id="${endpoint.componentId}"]`)
  if (!el) return null

  let pos
  if (endpoint.anchorId) {
    const a = el.querySelector(`[data-anchor-id="${endpoint.anchorId}"]`)
    pos = a ? getOffsetCenter(a, canvas, el, flipH, flipV) : null
  }
  if (!pos) pos = getOffsetCenter(el, canvas, el, flipH, flipV)

  const { x, dir } = getInnerEdgeX(el, canvas)
  return { x, y: pos.y, dir }
}

export default function CableLayer({
  canvasRef, cables, onSetCables, variant,
  role,
  cableTasks, onToggleCableTask, onAddCableTask,
  openCableModals, onOpenCableModal, onCloseCableModal,
  flipH = false, flipV = false,
}) {
  const setCables = onSetCables ?? (() => { })

  // Role-based behavior:
  //   - canEdit (moderator): toolbar visible, click on a cable removes it.
  //   - otherwise (operator): toolbar hidden, click on a cable opens a
  //     task modal — same task list UI as the rest of the components.
  const canEdit = can(role, 'editCables')

  const [pending, setPending] = useState(null) // {componentId, anchorId} first selected
  const [mousePos, setMousePos] = useState(null)
  const [mode, setMode] = useState('view')
  const [newCableType, setNewCableType] = useState('data')
  const [ruleError, setRuleError] = useState(null) // message shown on rejected connection

  // ── Precise Connection (zoomed dual-component anchor picker) ────────────
  //
  // Separate from `pending`/`mode` above so the two flows never interfere:
  // this only tracks which COMPONENT was clicked first while in 'precise'
  // mode. Once two components are picked, PreciseConnectionModal opens and
  // handles anchor selection itself — it does not reuse `pending`.
  const [preciseFirst, setPreciseFirst] = useState(null) // componentId
  const [preciseModal, setPreciseModal] = useState(null) // { compA, compB }

  // Derived values instead of syncing state in an effect: if the role loses
  // edit rights (e.g. switching user mid-session), add mode and any pending
  // selection are simply ignored — no setState, no cascading renders.
  const effectiveMode = canEdit ? mode : 'view'
  const effectivePending = canEdit ? pending : null

  // ── Repaint trigger ──────────────────────────────────────────────────────
  //
  // Cable positions are read straight from the DOM at render time (see
  // resolveEndpointPos), so we no longer cache measured positions in state.
  // We only need to force a re-render when the layout that those positions
  // depend on changes: images finishing load, the canvas resizing (zoom/pan),
  // or the variant switching. `tick` does exactly that — bumping it re-runs
  // render, which re-measures everything fresh. No race, no stale coordinates.
  const [tick, setTick] = useState(0)
  const repaint = () => setTick(t => t + 1)

  // Repaint once images inside the canvas have loaded (SVGs/raster assets can
  // change layout as they resolve).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imgs = Array.from(canvas.querySelectorAll('img'))
    const unloaded = imgs.filter(img => !img.complete)

    // Always repaint on next frame so first paint measures a settled layout.
    const raf = requestAnimationFrame(repaint)

    if (unloaded.length === 0) {
      return () => cancelAnimationFrame(raf)
    }

    const onLoad = () => repaint()
    unloaded.forEach(img => img.addEventListener('load', onLoad, { once: true }))
    return () => {
      cancelAnimationFrame(raf)
      unloaded.forEach(img => img.removeEventListener('load', onLoad))
    }
  }, [canvasRef])

  // Repaint on canvas resize (covers zoom/pan layout changes).
  useEffect(() => {
    if (!canvasRef.current) return
    const ro = new ResizeObserver(repaint)
    ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [canvasRef])

  // Repaint when the variant changes — component positions shift. Two frames
  // to catch any async layout settling after the new variant mounts.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      repaint()
      requestAnimationFrame(repaint)
    })
    return () => cancelAnimationFrame(raf)
  }, [variant])

  // ── Mouse tracking for in-progress cable preview ─────────────────────────

  useEffect(() => {
    if (effectiveMode !== 'add') return
    const onMove = (e) => {
      if (!canvasRef.current) return
      const r = canvasRef.current.getBoundingClientRect()
      // r.width / offsetWidth gives the current CSS scale factor
      const cssScale = r.width / (canvasRef.current.offsetWidth || 1)
      setMousePos({
        x: (e.clientX - r.left) / cssScale,
        y: (e.clientY - r.top) / cssScale,
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [effectiveMode, canvasRef])

  // Escape cancels add mode and precise-connection mode
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setPending(null)
      setMode('view')
      setPreciseFirst(null)
      setPreciseModal(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Position measurement ──────────────────────────────────────────────────
  //
  // React forbids reading a ref's `.current` during render, so instead of
  // resolving endpoint positions inline in the JSX we measure them in a layout
  // effect and store the result in state. `useLayoutEffect` runs synchronously
  // after the DOM is updated but before the browser paints, so the cables are
  // positioned correctly on the same frame — no visible flicker.
  //
  // We re-measure whenever something that can move the components changes:
  // `tick` (images loaded / resize / variant switch, see effects above),
  // the cable list, or the in-progress pending selection.
  const [positions, setPositions] = useState({})

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const next = {}
    const measure = (endpoint) => {
      if (!endpoint) return
      const key = endpointKey(endpoint)
      if (key in next) return
      next[key] = resolveEndpointPos(canvas, endpoint, flipH, flipV)
    }

    for (const cable of cables) {
      measure(cable.from)
      measure(cable.to)
    }
    if (effectivePending) measure(effectivePending)

    setPositions(next)
  }, [canvasRef, cables, effectivePending, tick, flipH, flipV])

  // Look up a previously measured position for an endpoint.
  function resolvePos(endpoint) {
    if (!endpoint) return null
    return positions[endpointKey(endpoint)] ?? null
  }

  // Click on the overlay — figure out which component was clicked
  function handleOverlayClick(e) {
    e.stopPropagation()
    if (!canvasRef.current) return

    // Temporarily disable the overlay so elementFromPoint can pass through
    // it and detect the real component under the cursor. This is more
    // reliable than manual hit-testing with getBoundingClientRect,
    // especially with CSS transforms and complex stacking contexts.
    const overlay = e.currentTarget
    overlay.style.pointerEvents = 'none'
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY)
    overlay.style.pointerEvents = ''

    // Walk up the DOM tree until an element with data-component-id is found
    const hit = elementBelow?.closest('[data-component-id]')
    if (!hit || !canvasRef.current.contains(hit)) return

    const componentId = hit.dataset.componentId

    if (effectiveMode === 'precise') {
      handlePreciseOverlayClick(componentId)
      return
    }

    if (!pending) {
      // First click — select component, use its first anchor as source
      setRuleError(null)
      const firstAnchor = hit.querySelector('[data-anchor-id]')
      setPending({
        componentId,
        anchorId: firstAnchor?.dataset.anchorId ?? null,
      })
      return
    }

    // Second click — same component deselects
    if (pending.componentId === componentId) {
      setPending(null)
      return
    }

    // Create the cable: from pending's first anchor to target's first anchor.
    // Enforce the connection rules: reject pairs the selected cable type can't join.
    if (!isConnectionAllowed(newCableType, pending.componentId, componentId)) {
      const [x, y] = CABLE_RULES[newCableType]
      setRuleError(
        `${newCableType.toUpperCase()} cables only connect ${x} ↔ ${y}`
      )
      setPending(null)
      return
    }
    setRuleError(null)

    const targetAnchor = hit.querySelector('[data-anchor-id]')
    setCables(prev => [...prev, {
      id: Date.now(),
      from: { componentId: pending.componentId, anchorId: pending.anchorId },
      to: { componentId, anchorId: targetAnchor?.dataset.anchorId ?? null },
      type: newCableType,
    }])
    setPending(null)
  }

  // ── Precise Connection flow ──────────────────────────────────────────────
  //
  // Two clicks select the two COMPONENTS (not anchors — same component
  // selection UX as the regular add-cable flow). Once both are picked, the
  // zoomed dual-component modal opens and handles exact anchor selection.
  function handlePreciseOverlayClick(componentId) {
    if (!getRegistryEntry(componentId)) {
      setRuleError(`${componentId} has no predefined connection anchors`)
      return
    }

    if (!preciseFirst) {
      setRuleError(null)
      setPreciseFirst(componentId)
      return
    }

    // Second click — same component deselects
    if (preciseFirst === componentId) {
      setPreciseFirst(null)
      return
    }

    setRuleError(null)
    setPreciseModal({
      compA: { componentId: preciseFirst, flipH, flipV },
      compB: { componentId, flipH, flipV },
    })
    setPreciseFirst(null)
  }

  function handlePreciseConfirm(cable) {
    setCables(prev => [...prev, { id: Date.now(), ...cable }])
    setPreciseModal(null)
  }

  function removeCable(id) {
    setCables(prev => prev.filter(c => c.id !== id))
  }

  // Click on a cable — behavior depends on the role
  function handleCableClick(cable) {
    if (canEdit) {
      removeCable(cable.id)
    } else {
      onOpenCableModal?.(cable.id)
    }
  }

  const pendingPos = effectivePending ? resolvePos(effectivePending) : null

  // Cables whose task modal is currently open (operator view)
  const openCables = cables.filter(c => openCableModals?.[c.id])

  return (
    <>
      {/* Click-blocker overlay — active in add or precise mode, sits above components */}
      {(effectiveMode === 'add' || effectiveMode === 'precise') && (
        <div
          onClick={handleOverlayClick}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            zIndex: 99,
            cursor: (pending || preciseFirst) ? 'crosshair' : 'cell',
          }}
        />
      )}

      {/* SVG overlay — pointer-events none; cables have visibleStroke for clicking */}
      <svg
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          zIndex: 100,
          overflow: 'visible',
        }}
      >
        <defs>
          {Object.entries(CABLE_COLORS).map(([type, color]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              markerWidth="6" markerHeight="6"
              refX="5" refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill={color} />
            </marker>
          ))}
        </defs>

        {/* Existing cables */}
        {cables.map(cable => {
          const p1 = resolvePos(cable.from)
          const p2 = resolvePos(cable.to)
          if (!p1 || !p2) return null
          const color = CABLE_COLORS[cable.type] ?? CABLE_COLORS.data
          const d = bezierPath(p1, p2)
          return (
            <g
              key={cable.id}
              style={{ pointerEvents: 'visibleStroke', cursor: 'pointer' }}
              onClick={() => handleCableClick(cable)}
            >
              <path d={d} fill="none" stroke="transparent" strokeWidth="10" />
              <path
                d={d} fill="none"
                stroke={color} strokeWidth="2"
                strokeLinecap="round"
                opacity="0.9"
              />
            </g>
          )
        })}

        {/* In-progress cable preview */}
        {pendingPos && mousePos && (
          <path
            d={bezierPath(pendingPos, mousePos)}
            fill="none"
            stroke={CABLE_COLORS[newCableType] ?? CABLE_COLORS.data}
            strokeWidth="2"
            strokeDasharray="6 3"
            strokeLinecap="round"
            opacity="0.7"
          />
        )}


      </svg>

      {/* Task modals for cables (operator view) — same UI as component modals */}
      {openCables.map(cable => (
        <TaskModal
          key={cable.id}
          componentId={`cable-${cable.id}`}
          anchors={[{ id: 'cable', label: cableLabel(cable) }]}
          tasks={{ cable: cableTasks?.[cable.id] || [] }}
          onToggleTask={(anchorId, idx) => onToggleCableTask?.(cable.id, idx)}
          onAddTask={(anchorId, text) => onAddCableTask?.(cable.id, text)}
          onClose={() => onCloseCableModal?.(cable.id)}
        />
      ))}

      {/* Precise Connection modal — zoomed dual-component anchor picker */}
      {preciseModal && (
        <PreciseConnectionModal
          compA={preciseModal.compA}
          compB={preciseModal.compB}
          existingCables={cables}
          cableType={newCableType}
          onChangeCableType={(type) => { setNewCableType(type); setRuleError(null) }}
          isConnectionAllowed={isConnectionAllowed}
          cableRules={CABLE_RULES}
          onConfirm={handlePreciseConfirm}
          onClose={() => setPreciseModal(null)}
        />
      )}

      {/* Toolbar — cable editing is moderator-only */}
      <div style={{
        position: 'absolute', bottom: -48, left: 0,
        display: 'flex', gap: 8, alignItems: 'center',
        zIndex: 200,
      }}>
        {canEdit && (
          <button
            onClick={() => { setMode(m => m === 'add' ? 'view' : 'add'); setPending(null); setRuleError(null) }}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: mode === 'add' ? '#3b82f6' : '#374151',
              color: '#fff', border: 'none', fontWeight: 600,
            }}
          >
            {mode === 'add' ? '✕ Cancel' : '+ Cable'}
          </button>
        )}

        {canEdit && (
          <button
            onClick={() => {
              setMode(m => m === 'precise' ? 'view' : 'precise')
              setPreciseFirst(null)
              setPending(null)
              setRuleError(null)
            }}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: mode === 'precise' ? '#3b82f6' : '#374151',
              color: '#fff', border: 'none', fontWeight: 600,
            }}
          >
            {mode === 'precise' ? '✕ Cancel' : '+ Precise Connection'}
          </button>
        )}

        {canEdit && mode === 'add' && (
          <>
            {Object.entries(CABLE_COLORS).map(([type, color]) => (
              <button
                key={type}
                onClick={() => { setNewCableType(type); setRuleError(null) }}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: newCableType === type ? color : '#1f2937',
                  color: '#fff', border: `2px solid ${color}`,
                  fontWeight: newCableType === type ? 700 : 400,
                }}
              >
                {type}
              </button>
            ))}
            <span style={{ fontSize: 11, color: ruleError ? '#ef4444' : '#9ca3af' }}>
              {ruleError
                ? ruleError
                : pending
                  ? `${pending.componentId} selected — click destination component`
                  : 'Click source component'}
            </span>
          </>
        )}

        {canEdit && mode === 'precise' && (
          <span style={{ fontSize: 11, color: ruleError ? '#ef4444' : '#9ca3af' }}>
            {ruleError
              ? ruleError
              : preciseFirst
                ? `${preciseFirst} selected — click the second component`
                : 'Click the first component'}
          </span>
        )}

        {effectiveMode === 'view' && cables.length > 0 && (
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            {cables.length} cable{cables.length !== 1 ? 's' : ''} — {canEdit
              ? 'click a cable to remove it'
              : 'click a cable to view its tasks'}
          </span>
        )}
      </div>
    </>
  )
}