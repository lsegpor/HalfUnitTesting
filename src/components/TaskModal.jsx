import { useState, useRef, useEffect } from 'react'
import { modalDraggingRef } from '../scripts/modalDraggingRef'
import { saveReport } from '../scripts/saveReport'

export default function TaskModal({ anchors, componentId, tasks, onToggleTask, onAddTask, onClose }) {
  const [newTask, setNewTask] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [pos, setPos] = useState({ x: 250, y: 230 })
  const [isDragging, setIsDragging] = useState(false)
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Flatten every anchor's tasks into a single list. Each entry keeps its
  // anchorId and the index within that anchor's list so toggling still maps
  // back to the per-anchor state structure in App.jsx.
  const allTasks = anchors.flatMap(anchor =>
    (tasks[anchor.id] || []).map((task, idx) => ({
      ...task,
      anchorId: anchor.id,
      idx,
    }))
  )

  const doneCount = allTasks.filter(t => t.done).length

  // New tasks go to the first anchor (single anchor for most components).
  const addAnchorId = anchors[0]?.id

  function handleAddTask() {
    if (!newTask.trim() || !addAnchorId) return
    onAddTask(addAnchorId, newTask.trim())
    setNewTask('')
    setShowInput(false)
  }

  function onHeaderMouseDown(e) {
    dragging.current = true
    modalDraggingRef.current = true
    setIsDragging(true)
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragging.current) return
      setPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      })
    }
    function onMouseUp() {
      if (dragging.current) {
        dragging.current = false
        modalDraggingRef.current = false
        setIsDragging(false)
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      // Clear on unmount in case the modal closes mid-drag
      modalDraggingRef.current = false
    }
  }, [])

  return (
    <div
      data-modal
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 440,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0d1017',
        border: '1px solid #3d4455',
        boxShadow: '0 0 40px rgba(0,212,255,0.15), 0 20px 60px rgba(0,0,0,0.8)',
        zIndex: 1000,
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {/* Draggable header */}
      <div
        onMouseDown={onHeaderMouseDown}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid #2a2f3a',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#ff6b35',
          boxShadow: '0 0 6px #ff6b35',
          flexShrink: 0
        }} />

        <div style={{
          flex: 1,
          fontFamily: 'monospace', fontSize: 11,
          color: '#00d4ff', letterSpacing: 2,
          textTransform: 'uppercase'
        }}>
          Tasks
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#5a6070' }}>
          {componentId}
        </div>
        <button
          onClick={onClose}
          onMouseDown={e => e.stopPropagation()}
          style={{
            background: 'none', border: 'none',
            color: '#5a6070', fontSize: 16,
            cursor: 'pointer', lineHeight: 1, padding: '0 4px'
          }}
        >✕</button>
      </div>

      {/* Body — single task list */}
      <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
        {allTasks.length === 0 && !showInput ? (
          <div style={{
            fontFamily: 'monospace', fontSize: 11,
            color: '#5a6070', padding: '4px 0'
          }}>
            No tasks. Add one with the button below.
          </div>
        ) : (
          <ul style={{
            listStyle: 'none', padding: 0, margin: 0,
            display: 'flex', flexDirection: 'column', gap: 8
          }}>
            {allTasks.map(task => (
              <li
                key={`${task.anchorId}-${task.idx}`}
                onClick={() => onToggleTask(task.anchorId, task.idx)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 12px',
                  background: '#1a1d24',
                  border: '1px solid #2a2f3a',
                  cursor: 'pointer',
                  opacity: task.done ? 0.5 : 1,
                  transition: 'opacity 0.15s'
                }}
              >
                <div style={{
                  width: 16, height: 16, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${task.done ? '#7fff6b' : '#3d4455'}`,
                  background: task.done ? '#7fff6b' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s'
                }}>
                  {task.done && (
                    <div style={{
                      width: 4, height: 7,
                      borderRight: '2px solid #0a0c0f',
                      borderBottom: '2px solid #0a0c0f',
                      transform: 'rotate(45deg) translateY(-1px)'
                    }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'sans-serif',
                    fontSize: 14, fontWeight: 500,
                    color: task.done ? '#5a6070' : '#e8ecf4',
                    textDecoration: task.done ? 'line-through' : 'none',
                    lineHeight: 1.4
                  }}>
                    {task.text}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {showInput && (
          <div style={{ display: 'flex', gap: 8, marginTop: allTasks.length ? 12 : 0 }}>
            <input
              autoFocus
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              onMouseDown={e => e.stopPropagation()}
              placeholder="New task..."
              style={{
                flex: 1,
                background: '#1a1d24',
                border: '1px solid #3d4455',
                color: '#e8ecf4',
                fontFamily: 'monospace',
                fontSize: 13,
                padding: '7px 10px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleAddTask}
              onMouseDown={e => e.stopPropagation()}
              style={{
                background: '#00d4ff', border: 'none',
                color: '#0a0c0f', fontFamily: 'monospace',
                fontSize: 11, padding: '7px 14px',
                cursor: 'pointer'
              }}
            >ADD</button>
          </div>
        )}
      </div>

      {/* Footer — progress bar */}
      <div style={{
        padding: '10px 18px',
        borderTop: '1px solid #2a2f3a',
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <div style={{ flex: 1, height: 3, background: '#1a1d24', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: allTasks.length ? `${(doneCount / allTasks.length) * 100}%` : '0%',
            background: '#7fff6b',
            borderRadius: 2,
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a6070', whiteSpace: 'nowrap' }}>
          {doneCount} / {allTasks.length}
        </div>
        <button
          onClick={() => setShowInput(v => !v)}
          onMouseDown={e => e.stopPropagation()}
          style={{
            background: 'none',
            border: '1px solid #2a2f3a',
            color: '#5a6070',
            fontFamily: 'monospace',
            fontSize: 11,
            padding: '4px 10px',
            cursor: 'pointer'
          }}
        >+ TASK</button>
        <button
          onClick={() => saveReport({
            componentId,
            anchorLabel: anchors[0]?.label ?? '',
            tasks: allTasks,
          })}
          onMouseDown={e => e.stopPropagation()}
          style={{
            background: '#1a1d24',
            border: '1px solid #3d4455',
            color: '#e8ecf4',
            fontFamily: 'monospace',
            fontSize: 11,
            padding: '4px 14px',
            cursor: 'pointer'
          }}
        >SAVE</button>
      </div>
    </div>
  )
}