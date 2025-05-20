export const getOrCreatePlayerId = () => {
  let playerId = localStorage.getItem("playerId");
  if (!playerId) {
    playerId = crypto.randomUUID().slice(0, 8);
    localStorage.setItem("playerId", playerId);
  }
  return playerId;
};
