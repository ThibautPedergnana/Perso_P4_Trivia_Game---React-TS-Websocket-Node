import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../socket";
import { getOrCreatePlayerId } from "../utils/playerId";
import SettingsButton from "../components/SettingsButton";
import SettingsModal from "../components/SettingsModal";
import PlayerList from "../components/PlayerList";

interface Player {
  id: string;
  name: string;
  score: number;
  isAdmin?: boolean;
}

export default function Room() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [questionDuration, setQuestionDuration] = useState(45);
  const [timeLeft, setTimeLeft] = useState(questionDuration);
  const [answer, setAnswer] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const totalQuestions = 10;
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { roomId } = useParams<{ roomId: string }>();
  const [players, setPlayers] = useState<Player[]>([]);

  const playerId = getOrCreatePlayerId();

  useEffect(() => {
    const storedPlayerName = localStorage.getItem("playerName");
    if (!roomId || !storedPlayerName) {
      navigate("/");
      return;
    }

    // Récupération initiale de la liste des joueurs
    socket.emit("getPlayerList", roomId, (players: Player[] | null) => {
      if (players) {
        setPlayers(players);
        setLoading(false);
      }
    });

    console.log("🔄 getPlayerList", {
      players,
    });
    console.log("🔄 Tentative de joinRoom", {
      roomId,
      storedPlayerName,
      playerId,
    });

    // Rejoindre la room
    socket.emit(
      "joinRoom",
      {
        roomId,
        playerName: storedPlayerName,
        playerId,
      },
      (response: { success: boolean }) => {
        console.log("Réponse du serveur joinRoom :", response);
      }
    );

    return () => {
      socket.off("getPlayerList");
    };
  }, [roomId, navigate, playerId]);

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
    socket.emit("submitAnswer", { roomId, playerId, answer });
    setAnswer("");

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      console.log("Fin du jeu!");
    }
  };

  useEffect(() => {
    setTimeLeft(questionDuration); // remet le timer à la durée configurée

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAnswer(); // soumet automatiquement quand timer = 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, questionDuration]);

  const currentPlayer = players.find((p) => p.id === playerId);
  const isAdmin = currentPlayer?.isAdmin;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
        <p>Chargement des joueurs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex relative">
      {/* Liste des joueurs avec PlayerList */}
      <div className="absolute left-4 top-4">
        <PlayerList players={players} showReadyStatus={false} />
      </div>

      {/* Bouton settings s'il est admin */}
      {isAdmin && (
        <div className="absolute top-4 left-72 z-10">
          <SettingsButton onClick={() => setIsSettingsOpen(true)} />
        </div>
      )}

      {/* Zone centrale */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-2xl text-center">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">
              Question : Quelle est la capitale de la France ?
            </h1>
            <span className="text-lg font-mono bg-black bg-opacity-30 px-3 py-1 rounded">
              ⏱ {timeLeft}s
            </span>
          </div>

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

      {/* Modal de paramètres */}
      {isSettingsOpen && (
        <SettingsModal
          questionDuration={questionDuration}
          setQuestionDuration={(newDuration) => {
            setQuestionDuration(newDuration);
            setTimeLeft(newDuration); // réinitialise le timer
          }}
          onClose={() => setIsSettingsOpen(false)}
          onSave={() => {
            socket.emit("updateRoomSettings", {
              roomId,
              questionDuration,
            });
            setIsSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}
