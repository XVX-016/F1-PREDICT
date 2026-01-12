import GlassWrapper from './GlassWrapper';
import EnhancedPodium from './EnhancedPodium';

interface PodiumSectionProps {
  drivers: Array<{ driverId: string; position?: number; driverName?: string; team?: string; winProbPct?: number }>;
  title?: string;
}

export default function PodiumSection({ drivers, title = 'PREDICTED PODIUM' }: PodiumSectionProps) {
  const ordered = [
    drivers.find(d => d.position === 2),
    drivers.find(d => d.position === 1),
    drivers.find(d => d.position === 3),
  ].filter(Boolean) as Array<{ driverId: string; position?: number; driverName?: string; team?: string; winProbPct?: number }>;

  return (
    <GlassWrapper accent className="p-5 mb-4 text-center h-full">
      <div className="flex items-center justify-center space-x-3 mb-5">
        <div className="p-2 bg-gray-800/20 rounded-xl border border-gray-600/30">
          {/* Trophy icon for consistent alignment */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-400"><path d="M4 3h16v3a4 4 0 0 1-4 4h-2v2.126A5.002 5.002 0 0 1 17 17h1v2H6v-2h1a5.002 5.002 0 0 1 3-4.874V10H8A4 4 0 0 1 4 6V3zm2 3a2 2 0 0 0 2 2h2V5H6v1zm8 1a2 2 0 0 0 2-2V5h-4v2h2z" /></svg>
        </div>
        <h2 className="text-2xl" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>{title}</h2>
      </div>

      <EnhancedPodium drivers={ordered as any} />
    </GlassWrapper>
  );
}
