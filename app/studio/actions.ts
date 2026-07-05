/**
 * actions.ts — barrel de compatibilidade do Studio.
 *
 * O antigo god module (~900 linhas) foi fatiado por responsabilidade:
 *   auth.ts          → sessão admin (HMAC-assinada), login/logout, requireAdmin
 *   users.ts         → CRUD de usuários pelo admin
 *   data.ts          → visão geral, live schema, documentação, métricas
 *   config.ts        → AppConfig key-value global
 *   notifications.ts → broadcasts manuais (CS-18)
 *   events.ts        → event log + security audit log (CS-18/CS-35)
 *   board.ts         → Kanban board (CS-20)
 *   system-info.ts   → versões + git (execSync isolado, não é server action)
 *
 * Importadores existentes continuam funcionando via re-export.
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
export type { KanbanColumn, KanbanCard, KanbanBoard } from "./board";
