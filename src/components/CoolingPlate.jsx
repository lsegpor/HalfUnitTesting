import coolingImg from '../assets/cooling.png'

// Background component — not interactive
// Original PDF size: 869.669 x 1498.68 pts
const IMG_ASPECT = 869.669 / 1498.68

export default function CoolingPlate({ top = '0px', left = '0px', width = '300px', zIndex = 0, componentId, flipH = false, flipV = false }) {
  const widthPx = parseInt(width)
  const heightPx = Math.round(widthPx / IMG_ASPECT)

  // Mirrors the plate's own artwork in place across mirrored variants.
  const flipTransform = `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`

  return (
    <div
      data-component-id={componentId}
      style={{
        position: 'absolute', top, left,
        width: widthPx, height: heightPx,
        userSelect: 'none', zIndex,
        pointerEvents: 'none',
        transform: flipTransform,
      }}>
      <img
        src={coolingImg}
        alt="Cooling Plate ROB/POB Front"
        draggable={false}
        style={{ width: widthPx, height: heightPx, display: 'block' }}
      />
    </div>
  )
}