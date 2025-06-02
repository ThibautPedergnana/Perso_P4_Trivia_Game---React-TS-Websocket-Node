type SettingsModalProps = {
  questionDuration: number;
  setQuestionDuration: (duration: number) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function SettingsModal({
  questionDuration,
  setQuestionDuration,
  onClose,
  onSave,
}: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-lg font-bold text-white mb-4">
          Paramètres de la Room
        </h2>

        <label className="block text-white mb-2 text-sm">
          Temps par question (en secondes) :
        </label>
        <input
          type="number"
          value={questionDuration}
          onChange={(e) => setQuestionDuration(parseInt(e.target.value))}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
        />

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
