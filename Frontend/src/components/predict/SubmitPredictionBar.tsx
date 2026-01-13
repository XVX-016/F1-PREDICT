import { motion } from 'framer-motion';
import { Send, Lock } from 'lucide-react';

interface SubmitPredictionBarProps {
    isValid: boolean;
    isSubmitted: boolean;
    raceStartsIn?: string;
    onSubmit: () => void;
    disabled?: boolean;
}

export default function SubmitPredictionBar({
    isValid,
    isSubmitted,
    raceStartsIn,
    onSubmit,
    disabled = false
}: SubmitPredictionBarProps) {
    const canSubmit = isValid && !isSubmitted && !disabled;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="sticky bottom-0 z-40 bg-black/90 backdrop-blur-xl border-t border-red-500/30 shadow-lg"
        >
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Left: Status/Info */}
                    <div className="flex-1 text-center sm:text-left">
                        {isSubmitted ? (
                            <div className="flex items-center gap-2 text-green-400">
                                <Lock className="w-5 h-5" />
                                <div>
                                    <div className="font-bold">✓ Prediction Submitted</div>
                                    <div className="text-sm text-gray-400">
                                        {raceStartsIn ? `Race starts in ${raceStartsIn}` : 'Locked for this race'}
                                    </div>
                                </div>
                            </div>
                        ) : !isValid ? (
                            <div className="text-yellow-400">
                                <div className="font-semibold">Complete your predictions</div>
                                <div className="text-sm text-gray-400">
                                    Fill in all required fields to submit
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-300">
                                <div className="font-semibold">Ready to submit</div>
                                <div className="text-sm text-gray-400">
                                    Review your selections and submit your prediction
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Submit Button */}
                    <motion.button
                        whileHover={canSubmit ? { scale: 1.05 } : {}}
                        whileTap={canSubmit ? { scale: 0.95 } : {}}
                        onClick={onSubmit}
                        disabled={!canSubmit}
                        className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all min-w-[200px] ${canSubmit
                                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-500/50'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-60'
                            }`}
                    >
                        {isSubmitted ? (
                            <>
                                <Lock className="w-5 h-5" />
                                Locked
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Submit Prediction
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
