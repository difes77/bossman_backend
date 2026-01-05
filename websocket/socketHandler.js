// websocket/socketHandler.js
const jwt = require("jsonwebtoken");
const EVENTS = require("./socketEvents");

// ═══════════════════════════════════════════════════════════
// SOCKET HANDLER - Single Source of Truth
// ═══════════════════════════════════════════════════════════

let ioInstance = null;

/**
 * Initialize Socket.IO
 * @param {Server} io - Socket.IO Server instance
 */
const initializeSocket = (io) => {
  ioInstance = io;

  // ─────────────────────────────────────────────────────────
  // MIDDLEWARE: JWT Authentication (Optional)
  // ─────────────────────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        console.log(
          `✅ Socket authenticated: User ${
            decoded.user_id || decoded.id_karyawan || "unknown"
          }`
        );
      } else {
        socket.user = null;
      }
      next();
    } catch (error) {
      console.log(`⚠️ Socket auth skipped: ${error.message}`);
      socket.user = null;
      next(); // Allow connection tanpa auth
    }
  });

  // ─────────────────────────────────────────────────────────
  // CONNECTION HANDLER
  // ─────────────────────────────────────────────────────────
  io.on(EVENTS.CONNECTION, (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // Join Branch Room
    socket.on(EVENTS.JOIN_BRANCH, (idCabang) => {
      if (!idCabang) {
        console.log(`⚠️ Join branch failed: No idCabang provided`);
        return;
      }

      const roomName = `cabang_${idCabang}`;
      socket.join(roomName);
      socket.idCabang = idCabang;

      console.log(`👥 Socket ${socket.id} joined room: ${roomName}`);

      // Confirm join ke client
      socket.emit(EVENTS.ROOM_JOINED, {
        success: true,
        room: roomName,
        idCabang: idCabang,
      });
    });

    // Leave Branch Room
    socket.on(EVENTS.LEAVE_BRANCH, (idCabang) => {
      const roomName = `cabang_${idCabang}`;
      socket.leave(roomName);
      console.log(`👋 Socket ${socket.id} left room: ${roomName}`);
    });

    // Disconnect
    socket.on(EVENTS.DISCONNECT, (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} (${reason})`);
    });

    // Error Handler
    socket.on("error", (error) => {
      console.error(`🔥 Socket error (${socket.id}):`, error.message);
    });
  });

  console.log("✅ Socket.IO initialized successfully");
};

// ═══════════════════════════════════════════════════════════
// GETTER
// ═══════════════════════════════════════════════════════════

/**
 * Get Socket.IO instance
 * @returns {Server} Socket.IO Server instance
 */
const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO belum diinisialisasi!");
  }
  return ioInstance;
};

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS - Untuk dipanggil dari Controllers
// ═══════════════════════════════════════════════════════════

/**
 * Emit event ke branch tertentu
 */
const emitToBranch = (idCabang, event, data) => {
  if (!ioInstance) {
    console.error("⚠️ Socket.IO not initialized");
    return false;
  }

  const roomName = `cabang_${idCabang}`;
  const payload = {
    ...data,
    _timestamp: new Date().toISOString(),
  };

  ioInstance.to(roomName).emit(event, payload);
  console.log(
    `📤 Emit [${event}] to ${roomName}:`,
    JSON.stringify(payload).substring(0, 100)
  );

  return true;
};

/**
 * Emit event ke semua connected clients
 */
const emitToAll = (event, data) => {
  if (!ioInstance) {
    console.error("⚠️ Socket.IO not initialized");
    return false;
  }

  const payload = {
    ...data,
    _timestamp: new Date().toISOString(),
  };

  ioInstance.emit(event, payload);
  console.log(`📤 Emit [${event}] to ALL`);

  return true;
};

// ─────────────────────────────────────────────────────────
// SPECIFIC EMITTERS (Shortcut functions)
// ─────────────────────────────────────────────────────────

/** Emit PS Status Update */
const emitPsStatusUpdate = (idCabang, data) => {
  return emitToBranch(idCabang, EVENTS.PS_STATUS_UPDATED, data);
};

/** Emit Sewa Ditempat Started */
const emitSewaDitempatStarted = (idCabang, data) => {
  return emitToBranch(idCabang, EVENTS.SEWA_DITEMPAT_STARTED, data);
};

/** Emit Sewa Ditempat Completed */
const emitSewaDitempatCompleted = (idCabang, data) => {
  return emitToBranch(idCabang, EVENTS.SEWA_DITEMPAT_COMPLETED, data);
};

/** Emit Sewa Bawa Pulang Created */
const emitSewaBawaPulangCreated = (idCabang, data) => {
  return emitToBranch(idCabang, EVENTS.SEWA_BAWA_PULANG_CREATED, data);
};

/** Emit Sewa Bawa Pulang Approved */
const emitSewaBawaPulangApproved = (idCabang, data) => {
  return emitToBranch(idCabang, EVENTS.SEWA_BAWA_PULANG_APPROVED, data);
};

/** Emit Sewa Bawa Pulang Rejected */
const emitSewaBawaPulangRejected = (idCabang, data) => {
  return emitToBranch(idCabang, EVENTS.SEWA_BAWA_PULANG_REJECTED, data);
};

/** Emit Sewa Bawa Pulang Completed */
const emitSewaBawaPulangCompleted = (idCabang, data) => {
  return emitToBranch(idCabang, EVENTS.SEWA_BAWA_PULANG_COMPLETED, data);
};

/** Emit Report Created */
const emitReportCreated = (idCabang, data) => {
  return emitToBranch(idCabang, EVENTS.REPORT_CREATED, data);
};

/** Emit Notification */
const emitNotification = (idCabang, data) => {
  return emitToBranch(idCabang, EVENTS.NOTIFICATION, data);
};

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

module.exports = {
  // Init
  initializeSocket,
  getIO,

  // Generic emitters
  emitToBranch,
  emitToAll,

  // Specific emitters
  emitPsStatusUpdate,
  emitSewaDitempatStarted,
  emitSewaDitempatCompleted,
  emitSewaBawaPulangCreated,
  emitSewaBawaPulangApproved,
  emitSewaBawaPulangRejected,
  emitSewaBawaPulangCompleted,
  emitReportCreated,
  emitNotification,

  // Events constant
  EVENTS,
};
