import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

interface ProgressIndicatorProps {
    totalSteps: number;
    completedSteps: number;
    steps: { label: string; completed: boolean }[];
}

export default function ProgressIndicator({ totalSteps, completedSteps, steps }: ProgressIndicatorProps) {
    const progressPercent = (completedSteps / totalSteps) * 100;

    return (
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-300">
                        Prediction Progress
                    </span>
                    <span className="text-sm font-bold text-white">
                        {completedSteps}/{totalSteps} Complete
                    </span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${progressPercent === 100
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : 'bg-gradient-to-r from-red-500 to-red-600'
                            }`}
                    />
                </div>
            </div>

            {/* Step Checklist */}
            <div className="flex flex-wrap gap-3">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${step.completed
                                ? 'bg-green-500/20 border border-green-500/30'
                                : 'bg-white/5 border border-white/10'
                            }`}
                    >
                        {step.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                            <Circle className="w-4 h-4 text-gray-500" />
                        )}
                        <span className={`text-sm font-medium ${step.completed ? 'text-green-300' : 'text-gray-400'
                            }`}>
                            {step.label}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
