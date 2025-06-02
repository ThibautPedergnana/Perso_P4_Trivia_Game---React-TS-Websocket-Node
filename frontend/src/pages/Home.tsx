import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import socket from "../socket";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrCreatePlayerId } from "../utils/playerId";

const schema = z.object({
  playerName: z.string().min(1, "Pseudo requis"),
  roomId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Home() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const [roomJoinError, setRoomJoinError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onCreateRoom = (data: FormData) => {
    setLoading(true);

    const roomId = crypto.randomUUID().slice(0, 6);
    const playerId = getOrCreatePlayerId();
    localStorage.setItem("playerName", data.playerName);
    localStorage.setItem("playerId", playerId);

    socket.emit(
      "createRoom",
      {
        roomId,
        playerName: data.playerName,
        playerId,
      },
      (response: { success: boolean }) => {
        if (!response.success) {
          setRoomJoinError("Erreur lors de la création de la room.");
          setLoading(false);
        } else {
          navigate(`/lobby/${roomId}`);

          setLoading(false);
        }
      }
    );
  };

  const onJoinRoom = (data: FormData) => {
    if (!data.roomId) {
      setError("roomId", {
        type: "manual",
        message: "ID requis pour rejoindre une room",
      });
      return;
    }

    const playerId = getOrCreatePlayerId();
    localStorage.setItem("playerName", data.playerName);
    localStorage.setItem("playerId", playerId);

    socket.emit(
      "joinRoom",
      {
        roomId: data.roomId,
        playerName: data.playerName,
        playerId,
      },
      (response: { success: boolean; message?: string }) => {
        if (response.success) {
          navigate(`/lobby/${data.roomId}`);
        } else {
          setRoomJoinError(response.message || "Cette room n'existe pas.");
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-xl space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Bienvenue sur Trivia Game
        </h1>

        <form onSubmit={handleSubmit(onCreateRoom)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Pseudo</label>
            <input
              type="text"
              placeholder="Ton pseudo"
              {...register("playerName")}
              className="w-full mt-1 p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.playerName && (
              <p className="text-red-400 text-sm mt-1">
                {errors.playerName.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded transition"
            disabled={loading}
          >
            {loading ? "Chargement..." : "Créer une room"}
          </button>
        </form>

        <form onSubmit={handleSubmit(onJoinRoom)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">ID de la room</label>
            <input
              type="text"
              placeholder="ID de la room"
              {...register("roomId")}
              className="w-full mt-1 p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.roomId && (
              <p className="text-red-400 text-sm mt-1">
                {errors.roomId.message}
              </p>
            )}
            {roomJoinError && (
              <p className="text-red-400 text-sm mt-1">{roomJoinError}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition"
            disabled={loading}
          >
            {loading ? "Chargement..." : "Rejoindre une room"}
          </button>
        </form>
      </div>
    </div>
  );
}
