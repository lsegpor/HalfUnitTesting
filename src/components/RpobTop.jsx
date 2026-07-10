import rpobImg from '../assets/rpob.jpg'
import TaskModal from './TaskModal'

const ANCHORS = [{ id: 'component', label: 'RPOB', xPct: 50, yPct: 50 }]

export default function RpobTop({
  top = '0px', left = '0px', width = '500px', id = 1, zIndex = 1, componentId,
  tasks, onToggleTask, onAddTask,
  modalOpen, onOpenModal, onCloseModal,
  flipH = false, flipV = false,
}) {
  const imgAspect = 780 / 126
  const widthPx = parseInt(width)
  const heightPx = Math.round(widthPx / imgAspect)

  // RPOB's single anchor is centered, so this flip has no functional effect
  // on the anchor, but keeps the artwork orientation consistent with the
  // other placeable components across mirrored variants.
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
          src={rpobImg}
          alt="RPOB Top"
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
          componentId={`RPOB #${id}`}
          tasks={tasks}
          onToggleTask={onToggleTask}
          onAddTask={onAddTask}
          onClose={onCloseModal}
        />
      )}
    </>
  )
}