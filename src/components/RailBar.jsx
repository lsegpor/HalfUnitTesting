// Decorative rail bar rendered above and below the C-frame. Purely visual —
// it carries no component id, no anchors, no tasks. The actual rail
// metadata (type + distance between rails) is tracked separately as a
// single global value in App.jsx (railConfig) and has no effect on this
// component's appearance.
const RAIL_WIDTH = 687
const RAIL_HEIGHT = 12
const RUNG_SPACING = 28

export default function RailBar({ position = 'top', zIndex = 0 }) {
  const offsetStyle = position === 'top'
    ? { top: -RAIL_HEIGHT - 4 }
    : { bottom: -RAIL_HEIGHT - 4 }

  const rungCount = Math.floor(RAIL_WIDTH / RUNG_SPACING)

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: RAIL_WIDTH,
        height: RAIL_HEIGHT,
        zIndex,
        pointerEvents: 'none',
        userSelect: 'none',
        background: 'linear-gradient(180deg, #b8bec9 0%, #8a8f99 45%, #6b7078 100%)',
        border: '1px solid #4a5060',
        boxSizing: 'border-box',
        ...offsetStyle,
      }}
    >
      {Array.from({ length: rungCount }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 1,
            left: i * RUNG_SPACING + RUNG_SPACING / 2,
            width: 1,
            height: RAIL_HEIGHT - 2,
            background: 'rgba(0,0,0,0.25)',
          }}
        />
      ))}
    </div>
  )
}