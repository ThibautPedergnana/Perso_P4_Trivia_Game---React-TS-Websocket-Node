import React from "react";

type AdminModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-white relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-4">Modifier les règles</h2>
        <p className="text-gray-300">
          Ici, on pourra mettre le formulaire des règles.
        </p>
      </div>
    </div>
  );
};

export default AdminModal;
