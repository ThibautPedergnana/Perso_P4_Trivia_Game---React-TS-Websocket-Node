type SettingsButtonProps = {
  onClick: () => void;
};

export default function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button onClick={onClick} className="mb-4 cursor-pointer">
      ⚙️
    </button>
  );
}
