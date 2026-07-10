export default function HVPlate({
  top = '0px', left = '0px',
  width = '40px', height = '20px',
  zIndex = 1, componentId, flipH = false, flipV = false,
}) {
  const flipTransform = `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`

  return (
    <div
      data-component-id={componentId}
      style={{
        position: 'absolute', top, left,
        width: parseInt(width), height: parseInt(height),
        background: '#ffffff',
        border: '1px solid #787878',
        boxSizing: 'border-box',
        zIndex,
        userSelect: 'none',
        pointerEvents: 'auto',
        cursor: 'pointer',
        transform: flipTransform,
      }}
    />
  )
}