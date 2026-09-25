// Draws the stack of modules mounted on a half-ladder, overlaid on top of
// EmptyLadder using the same top/left/width so both line up exactly.
//
// Not to true scale — block height is each module's mm size relative to
// the total, scaled to fit the visible track. Good enough to tell at a
// glance that sizes differ, per spec.

const IMG_ASPECT = 57 / 376
const SIZE_COLORS = { 22: '#3b82f6', 42: '#22c55e', 64: '#f59e0b', 122: '#ef4444' }
const TOP_MARGIN_PCT = 0.06 // leaves room for the clip icon at the frame end

export default function LadderModules({
    top = '0px', left = '0px', width = '30px',
    sizesMm = [], zIndex = 2, flipH = false, flipV = false,
}) {
    console.log('LadderModules', { id: /* no tienes id aquí, usa sizesMm */ sizesMm })
    const widthPx = parseInt(width)
    const heightPx = Math.round(widthPx / IMG_ASPECT)
    const trackHeight = heightPx * (1 - TOP_MARGIN_PCT)

    const totalMm = sizesMm.reduce((s, mm) => s + mm, 0) || 1
    const flipTransform = `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`

    // Builds each block AND tracks the running bottom offset in the same pass,
    // without reassigning any variable — the accumulator is replaced, not mutated.
    const { blocks } = sizesMm.reduce((acc, mm, i) => {
        const h = (mm / totalMm) * trackHeight
        const bottom = acc.cursor
        return {
            cursor: acc.cursor + h,
            blocks: [
                ...acc.blocks,
                <div
                    key={i}
                    title={`${mm} mm`}
                    style={{
                        position: 'absolute', left: 2, right: 2,
                        bottom, height: h,
                        background: SIZE_COLORS[mm] ?? '#888',
                        opacity: 0.8,
                        border: '1px solid rgba(0,0,0,0.4)',
                        boxSizing: 'border-box',
                        fontFamily: 'monospace', fontSize: 7, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                    }}
                >
                    {h > 10 ? mm : ''}
                </div>,
            ],
        }
    }, { cursor: 0, blocks: [] })

    return (
        <div style={{
            position: 'absolute', top, left,
            width: widthPx, height: heightPx,
            zIndex, pointerEvents: 'none',
            transform: flipTransform,
        }}>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: trackHeight }}>
                {blocks}
            </div>
        </div>
    )
}