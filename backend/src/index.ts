import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = 3000;

type Player = { id: string; name: string; isAdmin: boolean; ready: boolean };

const rooms: Record<string, Player[]> = {};
const pendingRoomClosures: Record<string, NodeJS.Timeout> = {};
const disconnectedAdmins: Record<string, string> = {}; // roomId -> playerName
const socketIdToPlayerId: Record<string, string> = {};

io.on("connection", (socket) => {
  socket.on("createRoom", ({ roomId, playerName, playerId }, callback) => {
    rooms[roomId] = [
      {
        id: playerId,
        name: playerName,
        isAdmin: true,
        ready: false,
      },
    ];

    socketIdToPlayerId[socket.id] = playerId;
    socket.join(roomId);
    io.to(roomId).emit("playerList", rooms[roomId]);
    callback?.({ success: true });
  });

  socket.on("joinRoom", ({ roomId, playerName, playerId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback?.({ success: false });
    console.log("Rooms actuelles :", Object.keys(rooms));
    const existing = room.find((p) => p.id === playerId);
    if (existing) {
      existing.name = playerName;
    } else {
      room.push({
        id: playerId,
        name: playerName,
        isAdmin: false,
        ready: false,
      });
    }

    socketIdToPlayerId[socket.id] = playerId;
    socket.join(roomId);
    io.to(roomId).emit("playerList", room);
    callback?.({ success: true });
    // ✅ Si l'admin est revenu, annule la fermeture
    if (
      disconnectedAdmins[roomId] === playerId &&
      pendingRoomClosures[roomId]
    ) {
      clearTimeout(pendingRoomClosures[roomId]);
      delete pendingRoomClosures[roomId];
      delete disconnectedAdmins[roomId];
      console.log(
        `✅ Fermeture annulée : admin ${playerName} revenu dans ${roomId}`
      );
    }
  });

  socket.on(
    "setReadyStatus",
    ({
      roomId,
      playerId,
      ready,
    }: {
      roomId: string;
      playerId: string;
      ready: boolean;
    }) => {
      console.log(`[✔️ READY] ${playerId} est maintenant ${ready}`);

      const room = rooms[roomId];
      if (!room) return;

      const player = room.find((p) => p.id === playerId);
      if (!player) return;

      player.ready = ready;

      io.to(roomId).emit("playerList", room);
    }
  );

  socket.on("startGame", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const admin = room.find((p) => p.isAdmin);
    if (!admin || admin.id !== socketIdToPlayerId[socket.id]) {
      // Seul l'admin peut lancer la partie
      return;
    }

    // Vérifie que tous sont prêts
    if (!room.every((p) => p.ready)) return;

    io.to(roomId).emit("gameStarted");
  });

  socket.on("disconnect", () => {
    console.log(`Déconnexion socket ${socket.id}`);

    const playerId = socketIdToPlayerId[socket.id];
    if (!playerId) return;

    for (const roomId in rooms) {
      const room = rooms[roomId];
      const player = room.find((p) => p.id === playerId);

      if (!player) continue;

      if (player.isAdmin) {
        disconnectedAdmins[roomId] = player.id;

        pendingRoomClosures[roomId] = setTimeout(() => {
          const room = rooms[roomId];
          const adminStillInRoom = room?.some(
            (p) => p.id === disconnectedAdmins[roomId]
          );

          if (!adminStillInRoom) {
            delete rooms[roomId];
            io.to(roomId).emit("roomClosed");
            console.log(`🛑 Room ${roomId} fermée (admin non revenu)`);
          } else {
            console.log(
              `✅ Admin revenu à temps, pas de fermeture pour ${roomId}`
            );
          }

          delete pendingRoomClosures[roomId];
          delete disconnectedAdmins[roomId];
        }, 30000);

        console.log(`⌛ Admin déconnecté de ${roomId}, attente 30s`);
      } else {
        rooms[roomId] = room.filter((p) => p.id !== playerId);
        io.to(roomId).emit("playerList", rooms[roomId]);
        console.log(`👤 Joueur retiré de ${roomId}`);
      }
    }

    delete socketIdToPlayerId[socket.id];
  });

  socket.on(
    "getPlayerList",
    (roomId: string, callback?: (players: Player[]) => void) => {
      callback?.(rooms[roomId] ?? []);
    }
  );
});

server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
