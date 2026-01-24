
import { motion } from 'framer-motion';
import { X, Map as MapIcon } from 'lucide-react';

interface RaceDetailViewProps {
    race: any;
    onClose: () => void;
    getCountryFlag: (country: string) => string;
}

export default function RaceDetailView({ race, onClose, getCountryFlag }: RaceDetailViewProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl overflow-y-auto pt-20"
        >
            <div className="min-h-screen w-full relative">
                {/* Close Button - Sticky or Fixed */}
                <button
                    onClick={onClose}
                    className="fixed right-8 top-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-50 backdrop-blur-md hidden md:block"
                >
                    <X className="w-8 h-8" />
                </button>

                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="fixed right-4 top-4 p-2 rounded-full bg-black/50 text-white z-50 md:hidden"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Hero Section Container */}
                <div className="w-full max-w-7xl mx-auto pt-20 px-6 md:px-12">

                    {/* Header Card */}
                    <div className="relative w-full bg-black border border-white/10 rounded-3xl overflow-hidden mb-8">
                        {/* Background Elements */}
                        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-red-900/20 to-transparent opacity-50" />

                        <div className="relative z-10 p-12 md:p-16">
                            {/* Top Badge Row */}
                            <div className="flex items-center gap-4 mb-6">
                                <span className="px-4 py-1.5 bg-[#E10600] text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                                    Technical Briefing
                                </span>
                                <span className="text-gray-500 font-mono text-sm uppercase tracking-widest">
                                    Round {race.round}
                                </span>
                            </div>

                            {/* Main Title Group */}
                            <div className="mb-4">
                                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic text-white uppercase tracking-tighter leading-[0.9]">
                                    {race.country.toUpperCase()} <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                        GRAND PRIX
                                    </span>
                                </h1>
                            </div>

                            {/* Subtitle / Location */}
                            <div className="flex flex-col md:flex-row md:items-center gap-6 mt-6">
                                <div className="text-6xl drop-shadow-lg">
                                    {getCountryFlag(race.country)}
                                </div>
                                <div>
                                    <p className="text-xl md:text-2xl text-gray-400 font-medium tracking-tight">
                                        {race.circuitName}
                                    </p>
                                    <p className="text-sm text-gray-600 font-mono uppercase mt-1">
                                        {race.city}, {race.country}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Circuit Layout Section */}
                    <div className="relative w-full bg-[#15151e] border-t-4 border-[#E10600] rounded-3xl p-12 md:p-16 mb-20">
                        {/* Circuit Label */}
                        <div className="flex items-center gap-3 mb-12">
                            <MapIcon className="w-5 h-5 text-[#E10600]" />
                            <span className="text-[#E10600] font-mono text-sm font-bold uppercase tracking-[0.2em]">
                                Circuit Layout
                            </span>
                        </div>

                        {/* Flex Container for Map & Stats */}
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">

                            {/* Map Image */}
                            <div className="flex-1 w-full flex justify-center">
                                <img
                                    src={race.trackImg || '/circuits/f1_2024_aus_outline.png'}
                                    alt="Circuit Map"
                                    className="max-h-[400px] w-full object-contain filter invert opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/circuits/f1_2024_aus_outline.png';
                                    }}
                                />
                            </div>

                            {/* Stats Columns */}
                            <div className="grid grid-cols-3 gap-12 lg:min-w-[400px]">
                                <div className="text-center lg:text-left">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Length</p>
                                    <p className="text-3xl lg:text-4xl font-black text-white">5.412 <span className="text-lg text-gray-600">km</span></p>
                                </div>
                                <div className="text-center lg:text-left">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Laps</p>
                                    <p className="text-3xl lg:text-4xl font-black text-white">57</p>
                                </div>
                                <div className="text-center lg:text-left">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Turns</p>
                                    <p className="text-3xl lg:text-4xl font-black text-white">15</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
