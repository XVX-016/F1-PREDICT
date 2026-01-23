import PageContainer from "../components/layout/PageContainer";
import { SEASON_2026_DRIVERS } from "../data/season2026";

export default function DriversPage() {
  return (
    <PageContainer>
      <div className="space-y-12">
        <header className="border-l-4 border-[#E10600] pl-6 py-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
            F1 Drivers <span className="text-[#E10600]">2026</span>
          </h1>
          <p className="text-slate-400 font-mono text-xs mt-1 uppercase tracking-widest">Official Grid & Driver IDs</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
          {[...SEASON_2026_DRIVERS].sort((a, b) => a.teamName.localeCompare(b.teamName)).map((driver) => (
            <div
              key={driver.id}
              className="relative group rounded-xl overflow-hidden min-h-[220px] h-[280px] transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]"
              style={{
                backgroundColor: driver.teamColor
              }}
            >
              {/* Texture Pattern */}
              <div className="absolute inset-0 z-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '8px 8px'
              }}></div>

              <div className="absolute inset-0 z-10 flex flex-row items-stretch">
                {/* Left Content: Info */}
                <div className="flex-1 p-6 flex flex-col justify-between relative z-20">
                  {/* Top: Name & Team */}
                  <div className="pt-2">
                    <div className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1 flex items-center gap-2">
                      {driver.teamName}
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                      {driver.name.split(' ')[0]} <br />
                      <span className="text-white">
                        {driver.name.split(' ').slice(1).join(' ')}
                      </span>
                    </h2>
                  </div>

                  {/* Bottom: Number */}
                  <div className="pb-2">
                    <span className="text-6xl font-black text-white/20 italic font-mono select-none leading-none">
                      {driver.number}
                    </span>
                  </div>
                </div>

                {/* Right Content: Driver Image - Tighter Upper Body Crop */}
                <div className="w-[55%] h-full relative z-20 overflow-hidden">
                  {/* 
                    Upper Body Crop Adjustments:
                    - h-[230%]: Scale the image significantly (approx 2.3x) to crop to upper body.
                    - top-[12%]: Push the top down slightly so the head is aligned at ~70% of card visual height.
                    - right-[-1rem]: Offset horizontal position.
                    - object-top: Ensure we anchor to the head.
                    - scale-100: Reset base scale, use height for size.
                  */}
                  <img
                    src={driver.image}
                    alt={driver.name}
                    className="absolute top-[20%] right-8 h-[230%] w-auto max-w-none object-cover object-top transform transition-transform duration-500 group-hover:scale-[1.05] origin-top drop-shadow-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x400/111/444?text=' + driver.name;
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}