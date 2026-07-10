import { useState } from 'react'
import { getRegistryEntry } from '../scripts/anchorRegistry'

// Fullscreen modal that shows two components zoomed in, side by side, with
// their real predefined connection anchors as clickable points. Lets the
// moderator pick the EXACT anchor on each side instead of always defaulting
// to the first one in the DOM (which is what the regular "+ Cable" flow does).
//
// Self-contained: receives the two component ids + the candidate cable type
// (so it can validate/show the rule), and reports the finished cable back to
// the caller via onConfirm. It does not know about App-level cable state.

const CABLE_COLORS = {
    data: '#3b82f6',
    power: '#7c4a14',
    hv: '#9ca3af',
}

// Returns the set of anchorIds on `componentId` that are already occupied
// in any existing cable — regardless of what the other component is.
// An occupied anchor cannot be reused (one physical connector = one cable).
function usedAnchors(cables, componentId) {
    const used = new Set()
    for (const cable of cables) {
        if (cable.from.componentId === componentId) used.add(cable.from.anchorId)
        if (cable.to.componentId === componentId) used.add(cable.to.anchorId)
    }
    return used
}

function ZoomedComponent({
    componentId, entry, selectedAnchorId, onPickAnchor,
    flipH = false, flipV = false,
    usedAnchorIds = new Set(), existingConnectionCount = 0,
}) {
    const { label, img, imgAspect, anchors } = entry
    const boxWidth = 520
    const boxHeight = Math.round(boxWidth / imgAspect)
    const flipTransform = `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
            {/* Header: component id + existing-connections badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                    fontFamily: 'monospace', fontSize: 12, color: '#00d4ff',
                    letterSpacing: 1, userSelect: 'none',
                }}>
                    {label.toUpperCase()} — {componentId}
                </span>
                {existingConnectionCount > 0 && (
                    <span style={{
                        background: '#854d0e', color: '#fef08a',
                        fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                        padding: '2px 7px', borderRadius: 10, letterSpacing: 0.5,
                    }}>
                        {existingConnectionCount} existing connection{existingConnectionCount !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div style={{
                position: 'relative', width: boxWidth, height: boxHeight,
                background: '#11151c', border: '1px solid #2a2f3a', borderRadius: 6,
                transform: flipTransform,
            }}>
                {img ? (
                    <img
                        src={img}
                        alt={label}
                        draggable={false}
                        style={{ width: boxWidth, height: boxHeight, display: 'block', pointerEvents: 'none' }}
                    />
                ) : (
                    <div style={{
                        position: 'absolute', inset: 0, background: '#ffffff',
                        border: '1px solid #787878', boxSizing: 'border-box',
                    }} />
                )}

                {anchors.map(anchor => {
                    const isSelected = anchor.id === selectedAnchorId
                    const isUsed = usedAnchorIds.has(anchor.id)
                    return (
                        <button
                            key={anchor.id}
                            onClick={() => !isUsed && onPickAnchor(anchor.id)}
                            disabled={isUsed}
                            title={isUsed ? `${anchor.label} — already connected` : anchor.label}
                            style={{
                                position: 'absolute',
                                left: `${anchor.xPct}%`,
                                top: `${anchor.yPct}%`,
                                transform: 'translate(-50%, -50%)',
                                width: 16, height: 16,
                                borderRadius: '50%',
                                border: isUsed
                                    ? '2px solid #6b2121'
                                    : isSelected ? '2px solid #00d4ff' : '2px solid #6b7280',
                                background: isUsed
                                    ? '#450a0a'
                                    : isSelected ? '#00d4ff' : 'rgba(31,41,55,0.85)',
                                boxShadow: isSelected ? '0 0 8px rgba(0,212,255,0.7)' : 'none',
                                cursor: isUsed ? 'not-allowed' : 'pointer',
                                opacity: isUsed ? 0.5 : 1,
                                padding: 0,
                                zIndex: 2,
                            }}
                        />
                    )
                })}
            </div>

            {/* Anchor legend — also clickable, disabled when already used */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center',
                maxWidth: boxWidth,
            }}>
                {anchors.map(anchor => {
                    const isSelected = anchor.id === selectedAnchorId
                    const isUsed = usedAnchorIds.has(anchor.id)
                    return (
                        <button
                            key={anchor.id}
                            onClick={() => !isUsed && onPickAnchor(anchor.id)}
                            disabled={isUsed}
                            title={isUsed ? `${anchor.label} — already connected` : undefined}
                            style={{
                                padding: '3px 8px', borderRadius: 4, fontSize: 10,
                                fontFamily: 'monospace',
                                cursor: isUsed ? 'not-allowed' : 'pointer',
                                background: isUsed
                                    ? '#1a0a0a'
                                    : isSelected ? '#00d4ff' : '#1f2937',
                                color: isUsed
                                    ? '#6b2121'
                                    : isSelected ? '#0a0e14' : '#9ca3af',
                                border: `1px solid ${isUsed ? '#6b2121' : isSelected ? '#00d4ff' : '#374151'}`,
                                fontWeight: isSelected ? 700 : 400,
                                opacity: isUsed ? 0.6 : 1,
                                textDecoration: isUsed ? 'line-through' : 'none',
                            }}
                        >
                            {anchor.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default function PreciseConnectionModal({
    compA, compB, // { componentId, flipH, flipV }
    existingCables = [],
    cableType, onChangeCableType,
    isConnectionAllowed, cableRules,
    onConfirm, onClose,
}) {
    const [anchorA, setAnchorA] = useState(null)
    const [anchorB, setAnchorB] = useState(null)

    const entryA = getRegistryEntry(compA.componentId)
    const entryB = getRegistryEntry(compB.componentId)

    // Anchors already used in cables between exactly these two components
    const usedA = usedAnchors(existingCables, compA.componentId)
    const usedB = usedAnchors(existingCables, compB.componentId)

    // How many cables each component already has (shown in their badge)
    const existingCountA = existingCables.filter(c =>
        c.from.componentId === compA.componentId || c.to.componentId === compA.componentId
    ).length
    const existingCountB = existingCables.filter(c =>
        c.from.componentId === compB.componentId || c.to.componentId === compB.componentId
    ).length

    if (!entryA || !entryB) {
        // Defensive: should not happen since the trigger only fires for
        // families present in ANCHOR_REGISTRY, but fail loudly instead of
        // silently rendering a broken modal.
        return (
            <div style={overlayStyle}>
                <div style={panelStyle}>
                    <p style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 12 }}>
                        No predefined anchors found for {compA.componentId} or {compB.componentId}.
                    </p>
                    <button onClick={onClose} style={closeBtnStyle}>Close</button>
                </div>
            </div>
        )
    }

    const allowed = isConnectionAllowed(cableType, compA.componentId, compB.componentId)
    const canConfirm = allowed && anchorA && anchorB

    function handleConfirm() {
        if (!canConfirm) return
        onConfirm({
            from: { componentId: compA.componentId, anchorId: anchorA },
            to: { componentId: compB.componentId, anchorId: anchorB },
            type: cableType,
        })
    }

    return (
        <div style={overlayStyle}>
            <div style={panelStyle}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 18,
                }}>
                    <span style={{
                        fontFamily: 'monospace', fontSize: 13, color: '#00d4ff',
                        letterSpacing: 1.5, userSelect: 'none',
                    }}>
                        PRECISE CONNECTION
                    </span>
                    <button onClick={onClose} style={closeBtnStyle}>✕</button>
                </div>

                {/* Cable type picker */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
                    {Object.entries(CABLE_COLORS).map(([type, color]) => (
                        <button
                            key={type}
                            onClick={() => onChangeCableType(type)}
                            style={{
                                padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                                background: cableType === type ? color : '#1f2937',
                                color: '#fff', border: `2px solid ${color}`,
                                fontWeight: cableType === type ? 700 : 400,
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <ZoomedComponent
                        componentId={compA.componentId}
                        entry={entryA}
                        selectedAnchorId={anchorA}
                        onPickAnchor={setAnchorA}
                        flipH={compA.flipH}
                        flipV={compA.flipV}
                        usedAnchorIds={usedA}
                        existingConnectionCount={existingCountA}
                    />
                    <ZoomedComponent
                        componentId={compB.componentId}
                        entry={entryB}
                        selectedAnchorId={anchorB}
                        onPickAnchor={setAnchorB}
                        flipH={compB.flipH}
                        flipV={compB.flipV}
                        usedAnchorIds={usedB}
                        existingConnectionCount={existingCountB}
                    />
                </div>

                <div style={{
                    marginTop: 20, textAlign: 'center', fontFamily: 'monospace', fontSize: 11,
                    color: allowed ? '#9ca3af' : '#ef4444',
                }}>
                    {!allowed
                        ? `${cableType.toUpperCase()} cables only connect ${cableRules[cableType][0]} ↔ ${cableRules[cableType][1]}`
                        : !anchorA && !anchorB
                            ? 'Select an anchor on each component'
                            : !anchorA
                                ? `Select an anchor on ${compA.componentId}`
                                : !anchorB
                                    ? `Select an anchor on ${compB.componentId}`
                                    : `Ready: ${compA.componentId}::${anchorA} → ${compB.componentId}::${anchorB}`}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18 }}>
                    <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        style={{
                            ...confirmBtnStyle,
                            opacity: canConfirm ? 1 : 0.4,
                            cursor: canConfirm ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Create cable
                    </button>
                </div>
            </div>
        </div>
    )
}

const overlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(5,7,11,0.92)', // hides everything behind — "remove the background"
    zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const panelStyle = {
    background: '#0d1017', border: '1px solid #2a2f3a', borderRadius: 10,
    padding: 28, maxWidth: '95vw', maxHeight: '92vh', overflow: 'auto',
}

const closeBtnStyle = {
    background: 'transparent', border: '1px solid #374151', color: '#9ca3af',
    borderRadius: 6, width: 26, height: 26, cursor: 'pointer', fontSize: 13,
}

const cancelBtnStyle = {
    padding: '7px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
    background: '#1f2937', color: '#9ca3af', border: '1px solid #374151',
}

const confirmBtnStyle = {
    padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700,
    background: '#00d4ff', color: '#0a0e14', border: 'none',
}