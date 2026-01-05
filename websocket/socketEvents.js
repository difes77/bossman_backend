// websocket/socketEvents.js
// ═══════════════════════════════════════════════════════════
// CENTRALIZED EVENT NAMES
// ═══════════════════════════════════════════════════════════

module.exports = {
  // Connection & Room
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  JOIN_BRANCH: "join_branch",
  LEAVE_BRANCH: "leave_branch",
  ROOM_JOINED: "room:joined",

  // PS/Unit Status
  PS_STATUS_UPDATED: "ps:status:updated",
  PS_LIST_REFRESH: "ps:list:refresh",

  // Sewa Ditempat
  SEWA_DITEMPAT_STARTED: "sewa:ditempat:started",
  SEWA_DITEMPAT_COMPLETED: "sewa:ditempat:completed",
  SEWA_DITEMPAT_TIMER: "sewa:ditempat:timer",

  // Sewa Bawa Pulang
  SEWA_BAWA_PULANG_CREATED: "sewa:bawapulang:created",
  SEWA_BAWA_PULANG_APPROVED: "sewa:bawapulang:approved",
  SEWA_BAWA_PULANG_REJECTED: "sewa:bawapulang:rejected",
  SEWA_BAWA_PULANG_COMPLETED: "sewa:bawapulang:completed",

  // Report
  REPORT_CREATED: "report:created",
  REPORT_STATUS_UPDATED: "report:status:updated",

  // Notification
  NOTIFICATION: "notification:receive",
};
