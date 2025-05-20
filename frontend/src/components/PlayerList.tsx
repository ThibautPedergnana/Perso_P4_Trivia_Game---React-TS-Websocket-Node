import { useEffect, useState } from "react";
import socket from "../socket";
import { getOrCreatePlayerId } from "../utils/playerId";

type Player = {
  id: string;
  name: string;
  score: number;
  isAdmin: boolean;
};

export default function PlayerList({ roomId }: { roomId: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomClosed, setRoomClosed] = useState(false);
  const playerId = getOrCreatePlayerId();
  console.log("Mon ID:", playerId);
  console.log("Liste des joueurs:", players);

  useEffect(() => {
    const handlePlayerList = (players: Player[]) => {
      setPlayers(players);
    };

    const handleRoomClosed = () => {
      setRoomClosed(true);
    };

    socket.emit("getPlayerList", roomId, (players: Player[]) => {
      setPlayers(players);
    });

    socket.on("playerList", handlePlayerList);
    socket.on("roomClosed", handleRoomClosed);

    return () => {
      socket.off("playerList", handlePlayerList);
      socket.off("roomClosed", handleRoomClosed);
    };
  }, [roomId]);

  if (roomClosed) {
    return (
      <div className="absolute left-0 top-0 bottom-0 w-64 bg-red-800 p-4 rounded-r-2xl shadow-lg text-white">
        <h2 className="text-lg font-bold mb-4">La room a été fermée</h2>
        <p>Le créateur de la room s'est déconnecté.</p>
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-0 bottom-0 w-64 bg-gray-800 p-4 overflow-y-auto rounded-r-2xl shadow-lg">
      <h2 className="text-lg font-bold mb-4 text-white">
        Joueurs ({players.length})
      </h2>
      <ul className="space-y-2">
        {players.map((player) => {
          const isCurrent = player.id === playerId;
          return (
            <li
              key={player.id}
              className={`flex items-center space-x-2 px-2 py-1 rounded ${
                isCurrent ? "bg-indigo-600 text-white font-bold" : "text-white"
              }`}
            >
              {player.isAdmin && (
                <span title="Admin" className="text-yellow-400">
                  ⭐
                </span>
              )}
              <span>
                {player.name}
                {isCurrent && (
                  <span className="ml-1 text-xs text-gray-300">(toi)</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
