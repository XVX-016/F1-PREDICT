import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, TrendingUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIPrediction {
    driver: string;
    probability: number;
    confidence: 'high' | 'medium' | 'low';
}

interface AIInsightsProps {
    predictions: AIPrediction[];
    explanation?: string;
    confidence?: 'high' | 'medium' | 'low';
}

export default function AIInsights({ predictions, explanation, confidence = 'medium' }: AIInsightsProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getConfidenceColor = (conf: string) => {
        switch (conf) {
            case 'high':
                return 'text-green-400';
            case 'medium':
                return 'text-yellow-400';
            case 'low':
                return 'text-orange-400';
            default:
                return 'text-gray-400';
        }
    };

    const getConfidenceLabel = (conf: string) => {
        switch (conf) {
            case 'high':
                return 'High Confidence';
            case 'medium':
                return 'Medium Confidence';
            case 'low':
                return 'Low Confidence';
            default:
                return 'Unknown';
        }
    };

    return (
        <div className="bg-[#121217] border border-[#1f1f26] rounded-md overflow-hidden">
            {/* Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#1f1f26] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-white tracking-widest uppercase text-[10px]">
                        Physics_Engine_Attribution
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono text-gray-500 tracking-widest">
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </span>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="border-t border-[#1f1f26]"
                    >
                        <div className="p-6 space-y-6">
                            {/* Confidence Level */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">Model_Calibration_State</span>
                                <span className={`font-black font-mono text-[10px] uppercase ${getConfidenceColor(confidence)} bg-black/40 px-2 py-0.5 border border-[#1f1f26] rounded-xs`}>
                                    {getConfidenceLabel(confidence)}
                                </span>
                            </div>

                            {/* Top Predictions */}
                            <div>
                                <h4 className="text-[10px] font-mono text-gray-400 uppercase mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Optimized Race Outcomes
                                </h4>
                                <div className="space-y-2">
                                    {predictions.slice(0, 3).map((pred, index) => (
                                        <div
                                            key={index}
                                            className="group flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-lg hover:border-purple-500/30 transition-all font-mono"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' :
                                                    index === 1 ? 'bg-gray-400 text-black shadow-[0_0_10px_rgba(156,163,175,0.3)]' :
                                                        'bg-orange-600/80 text-white shadow-[0_0_10px_rgba(234,88,12,0.3)]'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <span className="text-white font-semibold text-xs tracking-tighter">{pred.driver}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs">
                                                <div className="w-24 md:w-32 bg-gray-800 rounded-full h-1 overflow-hidden relative">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pred.probability}%` }}
                                                        transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                                                        className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full relative"
                                                    >
                                                        <div className="absolute top-0 right-0 w-2 h-full bg-white opacity-30 shadow-[0_0_8px_#fff]"></div>
                                                    </motion.div>
                                                </div>
                                                <span className="text-white font-bold w-10 text-right">
                                                    {pred.probability}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Explanation */}
                            {explanation && (
                                <div className="bg-red-600/5 border border-red-600/20 rounded p-4 font-mono">
                                    <h4 className="text-[10px] font-bold text-red-600 mb-2 uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3" />
                                        Deterministic Attribution
                                    </h4>
                                    <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-tight">
                                        {explanation}
                                    </p>
                                </div>
                            )}

                            {/* Disclaimer */}
                            <div className="text-[9px] text-gray-700 border-t border-[#1f1f26] pt-4 uppercase font-mono tracking-widest">
                                Source: LGBM v2.5.0 + MC(10k) | No predictive warranty implied.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
