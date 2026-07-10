import f3plateImg from '../assets/f3platetop.png'

// Background component — not interactive
// Original PDF size: 1334.27 x 398.835 pts
const IMG_ASPECT = 1334.27 / 398.835

export default function F3PlateTop({ top = '0px', left = '0px', width = '800px', zIndex = 0, flipH = false, flipV = false }) {
  const widthPx = parseInt(width)
  const heightPx = Math.round(widthPx / IMG_ASPECT)

  // Mirrors the plate's own artwork in place across mirrored variants.
  const flipTransform = `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`

  return (
    <div style={{
      position: 'absolute', top, left,
      width: widthPx, height: heightPx,
      userSelect: 'none', zIndex,
      pointerEvents: 'none',
      transform: flipTransform,
    }}>
      <img
        src={f3plateImg}
        alt="F3 Plate Top"
        draggable={false}
        style={{ width: widthPx, height: heightPx, display: 'block' }}
      />
    </div>
  )
}