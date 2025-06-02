// components/PlayerList.tsx
import React from "react";

type Player = {
  id: string;
  name: string;
  isAdmin?: boolean;
  ready?: boolean;
};

type PlayerListProps = {
  players: Player[];
  title?: string;
  center?: boolean;
  showReadyStatus?: boolean;
};

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  title = "Joueurs",
  showReadyStatus = true,
}) => {
  return (
    <div className="bg-gray-700 rounded-md p-4">
      <h2 className="text-xl font-bold mb-4 text-center text-white">{title}</h2>
      <ul>
        {players.map((player) => (
          <li
            key={player.id}
            className="flex justify-between items-center border-b border-gray-600 py-2 text-white"
          >
            <div className="flex items-center gap-1">
              <span className="align-middle">{player.name}</span>
              {player.isAdmin && (
                <span className="text-yellow-500 text-sm align-middle leading-none">
                  👑
                </span>
              )}
            </div>

            {showReadyStatus && (
              <span
                className={player.ready ? "text-green-400" : "text-red-400"}
              >
                {player.ready ? "✅" : "❌"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;
