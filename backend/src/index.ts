import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = 3000;

type Player = { id: string; name: string; score: number; isAdmin: boolean };
const rooms: Record<string, Player[]> = {};
const pendingRoomClosures: Record<string, NodeJS.Timeout> = {};
const disconnectedAdmins: Record<string, string> = {}; // roomId -> playerName

io.on("connection", (socket) => {
  console.log("✅ Joueur connecté :", socket.id);

  socket.on(
    "createRoom",
    (
      { roomId, playerName }: { roomId: string; playerName: string },
      callback?: (response: { success: boolean }) => void
    ) => {
      if (rooms[roomId]) {
        callback?.({ success: false });
        return;
      }
      rooms[roomId] = [
        { id: socket.id, name: playerName, score: 0, isAdmin: true },
      ];
      socket.join(roomId);
      console.log(`Room ${roomId} créée par ${playerName} (${socket.id})`);
      io.to(roomId).emit("playerList", rooms[roomId]);
      callback?.({ success: true });
    }
  );

  socket.on("joinRoom", ({ roomId, playerName }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      callback?.({ success: false, message: "Room does not exist." });
      return;
    }

    let existingPlayer = room.find((p) => p.name === playerName);

    if (existingPlayer) {
      existingPlayer.id = socket.id;

      // Si l'admin revient, on annule la fermeture
      if (existingPlayer.isAdmin && pendingRoomClosures[roomId]) {
        clearTimeout(pendingRoomClosures[roomId]);
        delete pendingRoomClosures[roomId];
        delete disconnectedAdmins[roomId];
        console.log(`✅ Admin ${playerName} est revenu, room ${roomId} sauvée`);
      }
    } else {
      room.push({
        id: socket.id,
        name: playerName,
        score: 0,
        isAdmin: false,
      });
    }

    socket.join(roomId);
    io.to(roomId).emit("playerList", room);
    callback?.({ success: true });
  });

  socket.on("disconnect", () => {
    console.log(`Déconnexion socket ${socket.id}`);

    for (const roomId in rooms) {
      const room = rooms[roomId];
      const player = room.find((p) => p.id === socket.id);
      if (!player) continue;

      if (player.isAdmin) {
        disconnectedAdmins[roomId] = player.name;

        pendingRoomClosures[roomId] = setTimeout(() => {
          const room = rooms[roomId];
          const admin = room.find((p) => p.name === disconnectedAdmins[roomId]);

          if (!admin || admin.id !== socket.id) {
            delete rooms[roomId];
            io.to(roomId).emit("roomClosed");
            console.log(`🛑 Room ${roomId} fermée (admin non revenu)`);
          } else {
            console.log(`❌ Fermeture annulée (admin revenu dans les 30s)`);
          }

          delete pendingRoomClosures[roomId];
          delete disconnectedAdmins[roomId];
        }, 30000);

        console.log(`⌛ Admin déconnecté de ${roomId}, attente 30s`);
      } else {
        // Si joueur normal, on le retire directement
        rooms[roomId] = room.filter((p) => p.id !== socket.id);
        io.to(roomId).emit("playerList", rooms[roomId]);
        console.log(`👤 Joueur retiré de ${roomId}`);
      }
    }
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
