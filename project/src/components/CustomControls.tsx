import React from 'react';
import GlassWrapper from './GlassWrapper';
import { motion } from 'framer-motion';
import AnimatedSlider from './AnimatedSlider';

export interface CustomControlValues {
	tireWear: number;
	cornerDifficulty: number;
	drsEffect: number;
	trackGrip: number;
}

interface CustomControlsProps {
	values: CustomControlValues;
	onChange: (v: CustomControlValues) => void;
	onGenerate: () => void;
	isGenerating?: boolean;
	comparisonMode?: 'ai' | 'custom' | 'compare';
	onComparisonModeChange?: (mode: 'ai' | 'custom' | 'compare') => void;
	hasCustomPredictions?: boolean;
}

export default function CustomControls({ 
	values, 
	onChange, 
	onGenerate, 
	isGenerating = false, 
	comparisonMode = 'ai', 
	onComparisonModeChange, 
	hasCustomPredictions = false 
}: CustomControlsProps) {
	const update = (key: keyof CustomControlValues, val: number) => onChange({ ...values, [key]: val });
	return (
		<GlassWrapper className="p-6">
			<h3 className="text-xl font-bold mb-4">Custom Prediction Controls</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label className="text-sm text-gray-300">Tire Wear</label>
					<AnimatedSlider
						min={0}
						max={100}
						value={values.tireWear}
						onChange={(value) => update('tireWear', value)}
						className="w-full"
					/>
				</div>
				<div>
					<label className="text-sm text-gray-300">Corner Difficulty</label>
					<AnimatedSlider
						min={0}
						max={100}
						value={values.cornerDifficulty}
						onChange={(value) => update('cornerDifficulty', value)}
						className="w-full"
					/>
				</div>
				<div>
					<label className="text-sm text-gray-300">DRS Impact</label>
					<AnimatedSlider
						min={0}
						max={100}
						value={values.drsEffect}
						onChange={(value) => update('drsEffect', value)}
						className="w-full"
					/>
				</div>
				<div>
					<label className="text-sm text-gray-300">Track Grip</label>
					<AnimatedSlider
						min={0}
						max={100}
						value={values.trackGrip}
						onChange={(value) => update('trackGrip', value)}
						className="w-full"
					/>
				</div>
			</div>
			
			{/* Comparison Mode Controls */}
			{hasCustomPredictions && onComparisonModeChange && (
				<div className="mt-6 p-4 bg-black/30 rounded-lg border border-white/10">
					<h4 className="text-lg font-semibold mb-3 text-gray-200">View Mode</h4>
					<div className="flex space-x-2">
						<motion.button 
							whileHover={{ scale: 1.02 }} 
							whileTap={{ scale: 0.98 }}
							onClick={() => onComparisonModeChange('ai')}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
								comparisonMode === 'ai' 
									? 'bg-blue-600 text-white border border-blue-400' 
									: 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
							}`}
						>
							AI Predictions
						</motion.button>
						<motion.button 
							whileHover={{ scale: 1.02 }} 
							whileTap={{ scale: 0.98 }}
							onClick={() => onComparisonModeChange('custom')}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
								comparisonMode === 'custom' 
									? 'bg-green-600 text-white border border-green-400' 
									: 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
							}`}
						>
							Custom Predictions
						</motion.button>
						<motion.button 
							whileHover={{ scale: 1.02 }} 
							whileTap={{ scale: 0.98 }}
							onClick={() => onComparisonModeChange('compare')}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
								comparisonMode === 'compare' 
									? 'bg-purple-600 text-white border border-purple-400' 
									: 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
							}`}
						>
							Compare
						</motion.button>
					</div>
				</div>
			)}
			
			<div className="mt-6 flex justify-end">
				<motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onGenerate} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-xl border border-red-400/30">
					{isGenerating ? 'Generating…' : 'Generate Custom Predictions'}
				</motion.button>
			</div>
		</GlassWrapper>
	);
}


