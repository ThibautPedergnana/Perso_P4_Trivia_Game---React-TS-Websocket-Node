import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket";
import { getOrCreatePlayerId } from "../utils/playerId";
import { useNavigate } from "react-router-dom";
import PlayerList from "../components/PlayerList";
import AdminModal from "../components/AdminModal";

type Player = { id: string; name: string; isAdmin: boolean; ready: boolean };

export default function Lobby() {
  const { roomId } = useParams<{ roomId: string }>();
  const [players, setPlayers] = useState<Player[]>([]);
  const playerId = getOrCreatePlayerId();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    socket.emit("getPlayerList", roomId, (players: Player[]) => {
      setPlayers(players);
    });

    const handlePlayerList = (players: Player[]) => {
      setPlayers(players);
    };

    socket.on("playerList", handlePlayerList);

    return () => {
      socket.off("playerList", handlePlayerList);
    };
  }, [roomId]);

  useEffect(() => {
    const handler = () => {
      navigate(`/room/${roomId}`);
    };
    socket.on("gameStarted", handler);

    return () => {
      socket.off("gameStarted", handler);
    };
  }, [navigate, roomId]);

  // Détermine si le joueur courant est admin
  const currentPlayer = players.find((p) => p.id === playerId);
  const isAdmin = currentPlayer?.isAdmin ?? false;

  useEffect(() => {
    if (isAdmin) {
      setModalOpen(true);
    }
  }, [isAdmin]);

  if (!roomId) return <div>Room introuvable</div>;

  const onToggleReady = () => {
    if (!roomId || !playerId) return;
    const currentPlayer = players.find((p) => p.id === playerId);
    if (!currentPlayer) return;

    socket.emit("setReadyStatus", {
      roomId,
      playerId,
      ready: !currentPlayer.ready,
    });
  };

  const allReady = players.length > 0 && players.every((p) => p.ready);

  const onStartGame = () => {
    if (!allReady) return;
    socket.emit("startGame", { roomId });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">
        Lobby - Room <span className="text-cyan-400">{roomId}</span>
      </h1>

      <div className="w-full max-w-sm">
        <PlayerList players={players} />
      </div>

      <button
        onClick={onToggleReady}
        className={`cursor-pointer mt-6 w-full max-w-sm px-4 py-2 rounded font-semibold transition-colors ${
          currentPlayer?.ready
            ? "bg-gray-600 hover:bg-gray-700"
            : "bg-cyan-600 hover:bg-cyan-700"
        }`}
      >
        {currentPlayer?.ready ? "Annuler prêt" : "Se mettre prêt"}
      </button>

      {!isAdmin && (
        <p className="mt-4 text-yellow-300 italic text-center max-w-sm">
          En attente que l'admin lance la partie...
        </p>
      )}

      {isAdmin && (
        <button
          disabled={!allReady}
          onClick={onStartGame}
          className={`cursor-pointer mt-4 w-full max-w-sm px-4 py-2 rounded font-semibold transition-colors ${
            allReady
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-600 cursor-not-allowed"
          }`}
        >
          Lancer la partie
        </button>
      )}
      <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
