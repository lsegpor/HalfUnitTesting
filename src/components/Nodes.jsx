// Variantes del c-frame:
// 0 → inferior-izquierda (original)
// 1 → inferior-derecha   (espejo horizontal)
// 2 → superior-izquierda (espejo vertical)
// 3 → superior-derecha   (espejo en ambos ejes)

const getTransforms = (armLength) => ({
  0: '',
  1: `scale(-1,1) translate(-${armLength},0)`,
  2: 'scale(1,-1) translate(0,-1200)',
  3: `scale(-1,-1) translate(-${armLength},-1200)`,
})

// baseWidth = ancho en px que tenía la figura original (armLength=1000) a escala 600px
export default function Nodes({ variant = 0, armLength = 1150, baseWidth = 600 }) {
  const SCALE = baseWidth / 1040 // mismo factor px-por-unidad que el original, fijo
  const viewW = armLength + 40   // +40 = mismos 20px de margen a cada lado que el original
  const pxW = viewW * SCALE
  const pxH = 1240 * SCALE       // altura SIEMPRE igual, no depende de armLength

  return (
    <svg
      viewBox={`-20 -20 ${viewW} 1240`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: pxW, height: pxH, display: 'block' }}
    >
      <g transform={getTransforms(armLength)[variant] || ''}>
        <path
          d={`M ${armLength},0 L 0,0 L 0,930 L 350,930 L 350,500 L 650,300 L ${armLength},300 Z`}
          fill="#e8e8e8"
          stroke="#555"
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}