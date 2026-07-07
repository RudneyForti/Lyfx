/**
 * actions.ts — Studio compatibility barrel.
 *
 * The old god module (~900 lines) was split by responsibility:
 *   auth.ts          → admin session (HMAC-signed), login/logout, requireAdmin
 *   users.ts         → user CRUD by the admin
 *   data.ts          → overview, live schema, documentation, metrics
 *   config.ts        → global AppConfig key-value
 *   notifications.ts → manual broadcasts (CS-18)
 *   events.ts        → event log + security audit log (CS-18/CS-35)
 *   board.ts         → Kanban board (CS-20)
 *   system-info.ts   → versions + git (isolated execSync, not a server action)
 *
 * Existing importers keep working via re-export.
 */

export { adminLogin, adminLogout, getAdminSession, requireAdmin } from "./auth";

export {
  adminResetPassword,
  adminDeleteUser,
  adminCreateUser,
  getStudioDataForUser,
} from "./users";

export { getStudioData, getLiveSchema, getDocumentation, getServerMetrics } from "./data";
export type { SchemaColumn, SchemaForeignKey, SchemaTable, LiveSchema, ServerMetrics } from "./data";

export { getAppConfig, setAppConfig, saveAdminNotes } from "./config";
export type { AppConfigEntry } from "./config";

export {
  adminSendNotification,
  adminGetManualNotifications,
  adminDeleteNotification,
  adminUpdateNotification,
} from "./notifications";
export type { AdminSendNotificationInput, NotifBroadcast } from "./notifications";

export { adminGetEventLog, getAdminSecurityLog } from "./events";
export type { AuditEvent, AdminSecurityEvent } from "./events";

export { getKanbanBoard, saveKanbanBoard } from "./board";
export type { KanbanColumn, KanbanCard, KanbanBoard, KanbanChecklistItem, KanbanComment } from "./board";
