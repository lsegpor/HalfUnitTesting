import fpobImg from '../assets/fpobtop.png'
import TaskModal from './TaskModal'

// First 4 anchors renamed to conn0-conn3 to match PREDEFINED_CABLES in App.jsx
// The rest keep their original names feast4-feast15
const ANCHORS = [
  { id: 'conn0', label: 'Conn 0', xPct: 15.1, yPct: 85 },
  { id: 'conn1', label: 'Conn 1', xPct: 23.4, yPct: 85 },
  { id: 'conn2', label: 'Conn 2', xPct: 31.8, yPct: 85 },
  { id: 'conn3', label: 'Conn 3', xPct: 40.1, yPct: 85 },
  { id: 'feast4', label: 'Feast 4', xPct: 48.5, yPct: 85 },
  { id: 'feast5', label: 'Feast 5', xPct: 56.8, yPct: 85 },
  { id: 'feast6', label: 'Feast 6', xPct: 65.2, yPct: 85 },
  { id: 'feast7', label: 'Feast 7', xPct: 73.5, yPct: 85 },
  { id: 'feast8', label: 'Feast 8', xPct: 15.1, yPct: 15 },
  { id: 'feast9', label: 'Feast 9', xPct: 23.4, yPct: 15 },
  { id: 'feast10', label: 'Feast 10', xPct: 31.8, yPct: 15 },
  { id: 'feast11', label: 'Feast 11', xPct: 40.1, yPct: 15 },
  { id: 'feast12', label: 'Feast 12', xPct: 48.5, yPct: 15 },
  { id: 'feast13', label: 'Feast 13', xPct: 56.8, yPct: 15 },
  { id: 'feast14', label: 'Feast 14', xPct: 65.2, yPct: 15 },
  { id: 'feast15', label: 'Feast 15', xPct: 73.5, yPct: 15 },
]

export default function FpobTop({
  top = '0px', left = '0px', width = '500px', id = 1, zIndex = 1, componentId,
  tasks, onToggleTask, onAddTask,
  modalOpen, onOpenModal, onCloseModal,
  flipH = false, flipV = false,
}) {
  const imgAspect = 618.52 / 92.126
  const widthPx = parseInt(width)
  const heightPx = Math.round(widthPx / imgAspect)

  // Mirrors the component's own artwork + anchors in place. FPOB's anchors
  // are NOT symmetric in Y (conn0-3/feast4-7 sit at 85%, feast8-15 at 15%),
  // so this flip is required for verticallly-mirrored variants (2 and 3).
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
          src={fpobImg}
          alt="FPOB Top"
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
          componentId={`FPOB #${id}`}
          tasks={tasks}
          onToggleTask={onToggleTask}
          onAddTask={onAddTask}
          onClose={onCloseModal}
        />
      )}
    </>
  )
}