import { RAIL_TYPES } from '../scripts/railTypes'

// Fullscreen modal for the global rail info: rail type + distance between
// rails. Self-contained overlay, same visual pattern as
// PreciseConnectionModal — centers a panel over a dimmed backdrop.
//
// The data here is global (not per variant/side): one type + one distance
// value for the whole unit. The distance is free text and has no effect on
// rendering — it is only saved as metadata.

export default function RailInfoModal({ config, onChange, onClose }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 18,
        }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 13, color: '#00d4ff',
            letterSpacing: 1.5, userSelect: 'none',
          }}>
            RAIL INFO
          </span>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={fieldLabelStyle}>
            Rail type
            <select
              value={config.type}
              onChange={e => onChange({ ...config, type: e.target.value })}
              style={selectStyle}
            >
              {RAIL_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label style={fieldLabelStyle}>
            Distance between rails
            <input
              type="text"
              placeholder="e.g. 450 mm"
              value={config.distance}
              onChange={e => onChange({ ...config, distance: e.target.value })}
              style={inputStyle}
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
          <button onClick={onClose} style={confirmBtnStyle}>Done</button>
        </div>
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  background: 'rgba(5,7,11,0.92)',
  zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const panelStyle = {
  background: '#0d1017', border: '1px solid #2a2f3a', borderRadius: 10,
  padding: 28, width: 280, maxWidth: '95vw',
}

const closeBtnStyle = {
  background: 'transparent', border: '1px solid #374151', color: '#9ca3af',
  borderRadius: 6, width: 26, height: 26, cursor: 'pointer', fontSize: 13,
}

const fieldLabelStyle = {
  display: 'flex', flexDirection: 'column', gap: 6,
  fontFamily: 'monospace', fontSize: 10, color: '#9ca3af', letterSpacing: 0.5,
}

const selectStyle = {
  width: '100%', background: '#111', color: '#e8ecf4', border: '1px solid #2a2f3a',
  fontFamily: 'monospace', fontSize: 12, padding: '6px 8px', boxSizing: 'border-box',
}

const inputStyle = {
  width: '100%', background: '#111', color: '#e8ecf4', border: '1px solid #2a2f3a',
  fontFamily: 'monospace', fontSize: 12, padding: '6px 8px', boxSizing: 'border-box',
}

const confirmBtnStyle = {
  padding: '7px 20px', borderRadius: 6, fontSize: 12, fontWeight: 700,
  background: '#00d4ff', color: '#0a0e14', border: 'none', cursor: 'pointer',
}