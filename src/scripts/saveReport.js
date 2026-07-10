/**
 * saveReport.js
 * Generates a .txt report of the checked (done) tasks for a given anchor
 * and triggers a browser download into the reports/ folder by naming convention.
 *
 * @param {object} params
 * @param {string} params.componentId  - Display name of the component, e.g. "ROB3 #2"
 * @param {string} params.anchorLabel  - Display label of the anchor, e.g. "O-Hole"
 * @param {Array}  params.tasks        - Full task list: [{ text, done }]
 */
export function saveReport({ componentId, anchorLabel, tasks }) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "-"); // HH-MM-SS
  const timestamp = `${dateStr}_${timeStr}`;

  const doneTasks = tasks.filter((t) => t.done);
  const pendingTasks = tasks.filter((t) => !t.done);

  // Build file content
  const lines = [
    "═══════════════════════════════════════════════════",
    "  HALF-UNIT GUI — TASK REPORT",
    "═══════════════════════════════════════════════════",
    `  Component : ${componentId}`,
    `  Anchor    : ${anchorLabel}`,
    `  Date      : ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    `  Progress  : ${doneTasks.length} / ${tasks.length} tasks completed`,
    "───────────────────────────────────────────────────",
    "",
    "  COMPLETED",
    "  ─────────",
  ];

  if (doneTasks.length === 0) {
    lines.push("  (none)");
  } else {
    doneTasks.forEach((t) => {
      // doneAt is an ISO string recorded at the moment the task was checked
      const when = t.doneAt
        ? `  —  ${new Date(t.doneAt).toLocaleDateString()} ${new Date(t.doneAt).toLocaleTimeString()}`
        : "";
      lines.push(`  [x] ${t.text}${when}`);
    });
  }

  lines.push("");
  lines.push("  PENDING");
  lines.push("  ───────");

  if (pendingTasks.length === 0) {
    lines.push("  (none)");
  } else {
    pendingTasks.forEach((t) => lines.push(`  [ ] ${t.text}`));
  }

  lines.push("");
  lines.push("═══════════════════════════════════════════════════");

  const content = lines.join("\n");

  // Sanitise strings for use in a filename
  const sanitise = (str) => str.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `reports/${sanitise(componentId)}_${sanitise(anchorLabel)}_${timestamp}.txt`;

  // Trigger browser download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
