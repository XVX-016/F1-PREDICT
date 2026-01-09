import { useState, useEffect, useRef } from "react";
import { teams } from "../data/teams";
import TeamCard from "../components/TeamCard";

const ShowcasePage = () => {
  const [focused, setFocused] = useState(0);
  const [auto, setAuto] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (auto) {
      timer.current = setInterval(() => {
        setFocused(f => (f + 1) % teams.length);
      }, 30000);
    }
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, [auto]);

  const handleUserInteract = () => setAuto(false);

  return (
    <div className="relative min-h-screen bg-black">
      {/* Animated grid/track background here */}
      <div className="absolute inset-0 z-0">
        {/* Add your animated SVG/CSS grid or track */}
      </div>
      <div className="relative z-10 flex flex-wrap justify-center items-center py-12">
        {teams.map((team, idx) => (
          <div
            key={team.name}
            onMouseDown={handleUserInteract}
            onTouchStart={handleUserInteract}
          >
            <TeamCard team={team} focused={idx === focused} autoRotate={auto && idx === focused} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShowcasePage; 