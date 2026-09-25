import { useState } from 'react'

import ladderImg from '../assets/half_empty_ladder.png'
import centerLadderImg from '../assets/half_center_ladder.png'

const IMG_ASPECT = 57 / 376

export default function EmptyLadder({
  top = '0px',
  left = '0px',
  width = '30px',
  zIndex = 0,
  flipH = false,
  flipV = false,
  ladderType = 'half',
  onChangeLadder,
}) {
  const [showMenu, setShowMenu] = useState(false)

  const widthPx = parseInt(width)
  const heightPx = Math.round(widthPx / IMG_ASPECT)

  const flipTransform = `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`

  const currentImage =
    ladderType === 'center'
      ? centerLadderImg
      : ladderImg

  const handleClick = (e) => {
    e.stopPropagation()
    setShowMenu((prev) => !prev)
  }

  const handleChange = (e) => {
    e.stopPropagation()

    onChangeLadder?.()
    setShowMenu(false)
  }

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width: widthPx,
        height: heightPx,
        userSelect: 'none',
        zIndex,
      }}
    >
      <img
        src={currentImage}
        alt="Ladder"
        draggable={false}
        onClick={handleClick}
        style={{
          width: widthPx,
          height: heightPx,
          display: 'block',
          cursor: 'pointer',
          transform: flipTransform,
        }}
      />

      {showMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '6px',
            background: 'black',
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            whiteSpace: 'nowrap',
            zIndex: 9999,
          }}
        >
          <button
            onClick={handleChange}
            style={{
              border: 'none',
              background: 'none',
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            {ladderType === 'half'
              ? 'Change to central ladder'
              : 'Change to common ladder'}
          </button>
        </div>
      )}
    </div>
  )
}