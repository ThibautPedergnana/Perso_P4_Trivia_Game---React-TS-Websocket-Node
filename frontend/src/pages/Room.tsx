import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../socket";
import { getOrCreatePlayerId } from "../utils/playerId"; // Assure-toi que cette fonction est bien définie

interface Player {
  id: string;
  name: string;
  score: number;
  isAdmin?: boolean;
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const [answer, setAnswer] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const totalQuestions = 10;
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const playerId = getOrCreatePlayerId(); // Récupérer l'ID du joueur

  // Premier chargement + join room
  useEffect(() => {
    const storedPlayerName = localStorage.getItem("playerName");
    if (!roomId || !storedPlayerName) {
      navigate("/"); // Redirection si pas d'ID de room ou de pseudo
      return;
    }

    // Récupération initiale de la liste des joueurs
    socket.emit("getPlayerList", roomId, (players: Player[] | null) => {
      if (players) {
        setPlayers(players);
        setLoading(false);
      }
    });

    // Rejoindre la room
    socket.emit("joinRoom", {
      roomId,
      playerName: storedPlayerName,
      playerId,
    });

    return () => {
      socket.off("getPlayerList");
    };
  }, [roomId, navigate, playerId]);

  // Listener pour les mises à jour en temps réel de la liste des joueurs
  useEffect(() => {
    socket.on("playerList", (players: Player[]) => {
      setPlayers(players);
      setLoading(false);
    });

    return () => {
      socket.off("playerList");
    };
  }, []);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value);
  };

  const handleSubmitAnswer = () => {
    // Envoi de la réponse lorsque le joueur soumet
    socket.emit("submitAnswer", { roomId, playerId, answer });
    setAnswer(""); // Réinitialisation de la réponse

    // Passage à la question suivante
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Logique pour la fin du jeu si toutes les questions ont été répondues
      console.log("Fin du jeu!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
        <p>Chargement des joueurs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex relative">
      <div className="w-64 bg-gray-800 p-4 shadow-xl rounded-r-2xl">
        <h2 className="text-lg font-semibold mb-4 text-center">Joueurs</h2>
        <ul className="space-y-2">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded text-sm"
            >
              <span>
                {player.name}
                {player.isAdmin && (
                  <span className="text-yellow-400 ml-2" title="Admin">
                    ★
                  </span>
                )}
                {player.id === playerId && (
                  <span className="text-gray-400 text-xs ml-1">(toi)</span>
                )}
              </span>
              <span className="text-gray-400">{player.score} pts</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-2xl text-center">
          <h1 className="text-xl font-bold mb-4">
            Question : Quelle est la capitale de la France ?
          </h1>
          <p className="text-sm text-gray-400 mb-2">
            Question {currentQuestionIndex + 1}/{totalQuestions}
          </p>

          <input
            type="text"
            value={answer}
            onChange={handleAnswerChange}
            placeholder="Ta réponse"
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={handleSubmitAnswer}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded transition"
          >
            Soumettre la réponse
          </button>
        </div>
      </div>
    </div>
  );
}
