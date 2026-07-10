// Variantes del c-frame:
// 0 → inferior-izquierda (original)
// 1 → inferior-derecha   (espejo horizontal)
// 2 → superior-izquierda (espejo vertical)
// 3 → superior-derecha   (espejo en ambos ejes)

const TRANSFORMS = {
  0: '',
  1: 'scale(-1,1) translate(-1000,0)',
  2: 'scale(1,-1) translate(0,-1200)',
  3: 'scale(-1,-1) translate(-1000,-1200)',
}

export default function Nodes({ variant = 0 }) {
  return (
    <svg
      viewBox="-20 -20 1040 1240"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: '600px', display: 'block' }}
    >
      <g transform={TRANSFORMS[variant] || ''}>
        <path
          d="M 1000,0 L 0,0 L 0,1200 L 350,1200 L 350,500 L 650,300 L 1000,300 Z"
          fill="#e8e8e8"
          stroke="#555"
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}