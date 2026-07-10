// Entry screen where the user picks a role before accessing the GUI.
// No credentials for now (no database yet): selecting a role is enough.

import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../scripts/roles'

const ROLE_ICONS = {
    [ROLES.OPERATOR]: (
        // Wrench icon
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14.5 12 12 9.5l2.7-3.2z" />
        </svg>
    ),
    [ROLES.MODERATOR]: (
        // Shield icon
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    ),
}

export default function RoleSelectScreen({ onSelectRole }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            width: '100vw', height: '100vh', background: '#111',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 32,
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{
                    fontFamily: 'monospace', fontSize: 22, color: '#e8ecf4',
                    letterSpacing: 3, margin: 0, userSelect: 'none',
                }}>
                    HALF-UNIT GUI
                </h1>
                <p style={{
                    fontFamily: 'monospace', fontSize: 11, color: '#4a5060',
                    letterSpacing: 1.5, marginTop: 8, userSelect: 'none',
                }}>
                    SELECT USER TYPE TO CONTINUE
                </p>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
                {[ROLES.OPERATOR, ROLES.MODERATOR].map(role => (
                    <button
                        key={role}
                        onClick={() => onSelectRole(role)}
                        style={{
                            background: '#0d1017', border: '1px solid #2a2f3a',
                            color: '#e8ecf4', cursor: 'pointer',
                            width: 220, padding: '24px 18px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                            transition: 'border 0.15s, box-shadow 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.border = '1px solid #00d4ff'
                            e.currentTarget.style.boxShadow = '0 0 12px rgba(0,212,255,0.25)'
                            e.currentTarget.style.background = '#0d2233'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.border = '1px solid #2a2f3a'
                            e.currentTarget.style.boxShadow = 'none'
                            e.currentTarget.style.background = '#0d1017'
                        }}
                    >
                        <span style={{ color: '#00d4ff' }}>{ROLE_ICONS[role]}</span>
                        <span style={{
                            fontFamily: 'monospace', fontSize: 13, letterSpacing: 2,
                            color: '#e8ecf4', userSelect: 'none',
                        }}>
                            {ROLE_LABELS[role].toUpperCase()}
                        </span>
                        <span style={{
                            fontFamily: 'monospace', fontSize: 9, lineHeight: 1.5,
                            color: '#4a5060', letterSpacing: 0.5, textAlign: 'center', userSelect: 'none',
                        }}>
                            {ROLE_DESCRIPTIONS[role]}
                        </span>
                    </button>
                ))}
            </div>

            <p style={{
                fontFamily: 'monospace', fontSize: 9, color: '#3a4050',
                letterSpacing: 1, userSelect: 'none',
            }}>
                NO CREDENTIALS REQUIRED · ROLE-BASED ACCESS PENDING
            </p>
        </div>
    )
}