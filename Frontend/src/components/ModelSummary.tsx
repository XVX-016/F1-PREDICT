import React from 'react';
import GlassWrapper from './GlassWrapper';

interface ModelSummaryProps {
	biasNotes?: string;
	reliabilityScore?: number; // 0-100
	explainability?: string[];
}

export default function ModelSummary({ biasNotes = 'No significant bias detected after calibration.', reliabilityScore = 84, explainability = ['Track type sensitivity considered', 'Weather-adjusted win probabilities', 'Driver form and qualifying pace weighted'] }: ModelSummaryProps) {
	return (
		<GlassWrapper className="p-6">
			<h3 className="text-xl font-bold mb-4">Model Summary</h3>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-black/70 rounded-xl border border-white/10 p-4">
					<div className="text-sm text-gray-400 mb-1">Bias correction</div>
					<div className="text-gray-200">{biasNotes}</div>
				</div>
				<div className="bg-black/70 rounded-xl border border-white/10 p-4">
					<div className="text-sm text-gray-400 mb-1">Reliability score</div>
					<div className="text-2xl font-bold text-gray-100">{reliabilityScore}%</div>
				</div>
				<div className="bg-black/70 rounded-xl border border-white/10 p-4">
					<div className="text-sm text-gray-400 mb-2">Explainability insights</div>
					<ul className="list-disc list-inside text-gray-200 space-y-1">
						{explainability.map((e) => (
							<li key={e}>{e}</li>
						))}
					</ul>
				</div>
			</div>
		</GlassWrapper>
	);
}


