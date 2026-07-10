import moduleImg from '../assets/moduletop.png'
import TaskModal from './TaskModal'

// Anchor points from nodes.tex
// \anchor{base}{\pgfpoint{-4.14mm}{+6.50mm}}
// Relative to component center (100.8mm x 19.7mm)
const ANCHORS = [
  { id: 'base', label: 'Base', xPct: 46, yPct: 35 }
]

export default function ModuleTop({
  top = '0px', left = '0px', width = '300px', id = 1, zIndex = 1, componentId,
  tasks, onToggleTask, onAddTask,
  modalOpen, onOpenModal, onCloseModal,
  flipH = false, flipV = false,
}) {
  const imgAspect = 285.7 / 55.8
  const widthPx = parseInt(width)
  const heightPx = Math.round(widthPx / imgAspect)

  // Mirrors the component's own artwork + anchors in place. Anchors are
  // positioned in % inside this same wrapper, so scaleX/scaleY flips them
  // along with the image without needing to recompute xPct/yPct by hand.
  const flipTransform = `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`

  return (
    <>
      <div
        data-component-id={componentId}
        onClick={onOpenModal}
        style={{
          position: 'absolute', top, left,
          width: widthPx, height: heightPx,
          userSelect: 'none', zIndex,
          cursor: 'pointer',
          outline: modalOpen ? '2px solid #00d4ff' : '2px solid transparent',
          boxShadow: modalOpen ? '0 0 12px rgba(0,212,255,0.4)' : 'none',
          transition: 'outline 0.15s, box-shadow 0.15s',
          transform: flipTransform,
        }}
      >
        <img
          src={moduleImg}
          alt="Module Top"
          draggable={false}
          style={{ width: widthPx, height: heightPx, display: 'block', pointerEvents: 'none' }}
        />

        {ANCHORS.map(anchor => (
          <div
            key={anchor.id}
            data-anchor-id={anchor.id}
            data-anchor-label={anchor.label}
            style={{
              position: 'absolute',
              left: `${anchor.xPct}%`,
              top: `${anchor.yPct}%`,
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      {modalOpen && (
        <TaskModal
          anchors={ANCHORS}
          componentId={`Module #${id}`}
          tasks={tasks}
          onToggleTask={onToggleTask}
          onAddTask={onAddTask}
          onClose={onCloseModal}
        />
      )}
    </>
  )
}