import { useEffect, useState } from "react";

interface TimerProps {
  initialTime: number;
  onTimeUp: (timeLeft: number) => void; // Callback pour informer le parent quand le timer est fini
}

const Timer = ({ initialTime, onTimeUp }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          onTimeUp(0); // Informe le parent que le temps est écoulé
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp]);

  return <div className="text-2xl font-mono mb-4">{timeLeft}s</div>;
};

export default Timer;
