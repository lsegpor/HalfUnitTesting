export default function HVPlate({
  top = '0px', left = '0px',
  width = '40px', height = '20px',
  zIndex = 1, componentId, flipH = false, flipV = false,
}) {
  const w = parseInt(width)
  const h = parseInt(height)
  const flipTransform = `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`

  return (
    <div
      data-component-id={componentId}
      style={{
        position: 'absolute', top, left,
        width: w, height: h,
        border: '1px solid #787878',
        boxSizing: 'border-box',
        zIndex,
        userSelect: 'none',
        pointerEvents: 'auto',
        cursor: 'pointer',
        transform: flipTransform,
        overflow: 'hidden',
      }}
    >
      <svg
        width={h}
        height={w}
        viewBox="0 0 650 250"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(90deg)',
        }}
      >
        <rect x="20" y="30" width="620" height="85" rx="14" fill="#E6F1FB" stroke="#185FA5" strokeWidth="1.5" />
        <rect x="20" y="145" width="620" height="85" rx="14" fill="#E6F1FB" stroke="#185FA5" strokeWidth="1.5" />
        {Array.from({ length: 15 }, (_, i) => 60 + i * 40).map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={72} r="9" fill="#E6F1FB" stroke="#185FA5" strokeWidth="1.5" />
            <circle cx={cx} cy={72} r="3.5" fill="#185FA5" />
            <circle cx={cx} cy={188} r="9" fill="#E6F1FB" stroke="#185FA5" strokeWidth="1.5" />
            <circle cx={cx} cy={188} r="3.5" fill="#185FA5" />
          </g>
        ))}
      </svg>
    </div>
  )
}