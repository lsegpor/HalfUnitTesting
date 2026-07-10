// User role definitions for the Half-Unit GUI.
//
// No credentials / database yet: the user simply picks a role on the
// entry screen. When a backend is available, the role will come from
// the authenticated session instead.

export const ROLES = {
  OPERATOR: "operator",
  MODERATOR: "moderator",
};

export const ROLE_LABELS = {
  [ROLES.OPERATOR]: "Operator",
  [ROLES.MODERATOR]: "Moderator",
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.OPERATOR]: "Day-to-day assembly and task tracking",
  [ROLES.MODERATOR]: "Supervision, review and session management",
};

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS
//
// Defined rules so far:
//   - editCables: only the moderator can add and remove cables.
//     When the operator clicks a cable, a task modal opens instead.
//
// The remaining capabilities are placeholders (all allowed) until the
// full access model is specified. Gate the UI with can(role, action).
// ─────────────────────────────────────────────────────────────────────────────
export const PERMISSIONS = {
  [ROLES.OPERATOR]: {
    toggleTask: true,
    addTask: true,
    editCables: false,
    saveReport: true,
    saveSession: true,
    exportPng: true,
  },
  [ROLES.MODERATOR]: {
    toggleTask: true,
    addTask: true,
    editCables: true,
    saveReport: true,
    saveSession: true,
    exportPng: true,
  },
};

// Returns true if the given role is allowed to perform the action.
// Unknown roles or actions default to false (deny by default).
export function can(role, action) {
  return !!PERMISSIONS[role]?.[action];
}
