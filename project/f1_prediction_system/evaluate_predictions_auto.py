#!/usr/bin/env python3
"""
Automated F1 Prediction Evaluation Script
Pulls ML predictions and actual race results to calculate performance metrics
"""

import pandas as pd
import numpy as np
import requests
from sklearn.metrics import brier_score_loss, log_loss
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class F1PredictionEvaluator:
    def __init__(self):
        """Initialize the evaluator"""
        self.predictions_df = None
        self.actual_results_df = None
        self.merged_df = None
        
    def load_ml_predictions(self, source_type="csv", source_path=None):
        """Load ML predictions from various sources"""
        print("📊 Loading ML predictions...")
        
        if source_type == "csv" and source_path:
            try:
                self.predictions_df = pd.read_csv(source_path)
                print(f"  ✓ Loaded predictions from {source_path}")
            except FileNotFoundError:
                print(f"  ❌ {source_path} not found")
                return False
        elif source_type == "api" and source_path:
            try:
                response = requests.get(source_path, timeout=10)
                response.raise_for_status()
                self.predictions_df = pd.DataFrame(response.json())
                print(f"  ✓ Loaded predictions from API: {source_path}")
            except Exception as e:
                print(f"  ❌ Failed to load from API: {e}")
                return False
        else:
            # Try to find prediction files automatically
            try:
                # Look for monte carlo results or test predictions
                if pd.io.common.file_exists("monte_carlo_results.csv"):
                    self.predictions_df = pd.read_csv("monte_carlo_results.csv")
                    print("  ✓ Loaded predictions from monte_carlo_results.csv")
                elif pd.io.common.file_exists("test_predictions.csv"):
                    self.predictions_df = pd.read_csv("test_predictions.csv")
                    print("  ✓ Loaded predictions from test_predictions.csv")
                else:
                    print("  ❌ No prediction files found. Please run Monte Carlo simulator first.")
                    return False
            except Exception as e:
                print(f"  ❌ Error loading predictions: {e}")
                return False
        
        # Standardize column names
        if 'win_prob' in self.predictions_df.columns:
            self.predictions_df = self.predictions_df.rename(columns={'win_prob': 'prediction'})
        
        print(f"  📈 Found {len(self.predictions_df)} predictions")
        return True
    
    def load_actual_results(self, source_type="csv", source_path=None):
        """Load actual race results from various sources"""
        print("🏁 Loading actual race results...")
        
        if source_type == "csv" and source_path:
            try:
                self.actual_results_df = pd.read_csv(source_path)
                print(f"  ✓ Loaded results from {source_path}")
            except FileNotFoundError:
                print(f"  ❌ {source_path} not found")
                return False
        elif source_type == "wiki":
            try:
                # Scrape Wikipedia for 2025 F1 results
                wiki_url = "https://en.wikipedia.org/wiki/2025_Formula_One_World_Championship"
                tables = pd.read_html(wiki_url)
                
                # Find the race results table (usually table[3] or [4])
                for i, table in enumerate(tables):
                    if 'Grand Prix' in table.columns and 'Winner' in table.columns:
                        self.actual_results_df = table[['Grand Prix', 'Winner']].dropna()
                        self.actual_results_df.columns = ['race', 'winner']
                        print(f"  ✓ Scraped results from Wikipedia table {i}")
                        break
                else:
                    print("  ❌ Could not find race results table on Wikipedia")
                    return False
            except Exception as e:
                print(f"  ❌ Failed to scrape Wikipedia: {e}")
                return False
        else:
            # Try to find actual results files automatically
            try:
                if pd.io.common.file_exists("2025_race_results.csv"):
                    self.actual_results_df = pd.read_csv("2025_race_results.csv")
                    print("  ✓ Loaded results from 2025_race_results.csv")
                else:
                    print("  ❌ No actual results files found")
                    return False
            except Exception as e:
                print(f"  ❌ Error loading results: {e}")
                return False
        
        # Handle different column names in race results
        if 'raceName' in self.actual_results_df.columns:
            self.actual_results_df['race'] = self.actual_results_df['raceName']
        elif 'race' not in self.actual_results_df.columns:
            print("  ❌ No race column found in results file")
            return False
        
        # Extract winners from race results (position = 1)
        if 'position' in self.actual_results_df.columns and 'driver' in self.actual_results_df.columns:
            winners = self.actual_results_df[self.actual_results_df['position'] == 1][['race', 'driver']].copy()
            winners.columns = ['race', 'winner']
            self.actual_results_df = winners
            print(f"  ✓ Extracted {len(winners)} race winners from results")
        elif 'winner' not in self.actual_results_df.columns:
            print("  ❌ No winner information found in results file")
            return False
        
        # Clean and standardize race names
        self.actual_results_df['race'] = self.actual_results_df['race'].str.strip().str.lower()
        self.actual_results_df['winner'] = self.actual_results_df['winner'].str.strip()
        
        print(f"  🏆 Found {len(self.actual_results_df)} race results")
        return True
    
    def merge_predictions_and_results(self):
        """Merge predictions with actual results"""
        print("🔗 Merging predictions with actual results...")
        
        if self.predictions_df is None or self.actual_results_df is None:
            print("  ❌ Cannot merge: missing predictions or results")
            return False
        
        # Clean prediction data
        self.predictions_df['race'] = self.predictions_df['race'].str.strip().str.lower()
        self.predictions_df['driver'] = self.predictions_df['driver'].str.strip()
        
        # Merge on race
        self.merged_df = self.predictions_df.merge(
            self.actual_results_df, on='race', how='left'
        )
        
        # Add actual_win column (1 if driver == race winner)
        self.merged_df['actual'] = (self.merged_df['driver'] == self.merged_df['winner']).astype(int)
        
        # Filter out races without actual results
        races_with_results = self.merged_df[self.merged_df['actual'].notna()]
        
        if len(races_with_results) == 0:
            print("  ❌ No races found with both predictions and actual results")
            return False
        
        print(f"  ✓ Merged {len(races_with_results)} race predictions with actual results")
        return True
    
    def calculate_metrics(self):
        """Calculate Brier Score and Log Loss"""
        print("📊 Calculating performance metrics...")
        
        if self.merged_df is None:
            print("  ❌ Cannot calculate metrics: no merged data")
            return None
        
        # Filter for races with actual results
        valid_data = self.merged_df[self.merged_df['actual'].notna()].copy()
        
        if len(valid_data) == 0:
            print("  ❌ No valid data for metrics calculation")
            return None
        
        # Ensure predictions are probabilities between 0 and 1
        valid_data['prediction_clean'] = np.clip(valid_data['prediction'], 0, 1)
        
        # Calculate overall metrics
        brier = brier_score_loss(valid_data['actual'], valid_data['prediction_clean'])
        logloss = log_loss(valid_data['actual'], valid_data['prediction_clean'], labels=[0, 1])
        
        # Calculate per-race metrics
        race_metrics = []
        for race in valid_data['race'].unique():
            race_data = valid_data[valid_data['race'] == race]
            if len(race_data) > 0:
                race_brier = brier_score_loss(race_data['actual'], race_data['prediction_clean'])
                race_logloss = log_loss(race_data['actual'], race_data['prediction_clean'], labels=[0, 1])
                race_metrics.append({
                    'race': race,
                    'brier_score': race_brier,
                    'log_loss': race_logloss,
                    'predictions_count': len(race_data)
                })
        
        metrics = {
            'overall': {
                'brier_score': brier,
                'log_loss': logloss,
                'total_predictions': len(valid_data),
                'races_count': len(valid_data['race'].unique())
            },
            'per_race': race_metrics
        }
        
        print(f"  ✓ Calculated metrics for {len(valid_data)} predictions across {len(valid_data['race'].unique())} races")
        return metrics
    
    def analyze_driver_performance(self):
        """Analyze which drivers the model overestimates or underestimates"""
        print("👥 Analyzing driver performance...")
        
        if self.merged_df is None:
            print("  ❌ Cannot analyze drivers: no merged data")
            return None
        
        valid_data = self.merged_df[self.merged_df['actual'].notna()].copy()
        
        # Group by driver and calculate average prediction vs actual
        driver_analysis = valid_data.groupby('driver').agg({
            'prediction': 'mean',
            'actual': 'mean',
            'race': 'count'
        }).rename(columns={'race': 'races_count'})
        
        # Calculate prediction bias
        driver_analysis['prediction_bias'] = driver_analysis['prediction'] - driver_analysis['actual']
        driver_analysis['overestimation'] = driver_analysis['prediction_bias'] > 0.1
        driver_analysis['underestimation'] = driver_analysis['prediction_bias'] < -0.1
        
        # Sort by bias magnitude
        driver_analysis = driver_analysis.sort_values('prediction_bias', key=abs, ascending=False)
        
        print(f"  ✓ Analyzed performance for {len(driver_analysis)} drivers")
        return driver_analysis
    
    def plot_performance_analysis(self, metrics, driver_analysis):
        """Create performance visualization plots"""
        print("📈 Creating performance visualizations...")
        
        try:
            # Set up the plotting style
            plt.style.use('seaborn-v0_8')
            fig, axes = plt.subplots(2, 2, figsize=(15, 12))
            fig.suptitle('F1 Prediction Model Performance Analysis', fontsize=16, fontweight='bold')
            
            # 1. Per-race Brier Score
            if metrics and 'per_race' in metrics:
                race_names = [m['race'].title() for m in metrics['per_race']]
                brier_scores = [m['brier_score'] for m in metrics['per_race']]
                
                axes[0, 0].bar(range(len(race_names)), brier_scores, color='skyblue', alpha=0.7)
                axes[0, 0].set_title('Brier Score by Race')
                axes[0, 0].set_xlabel('Race')
                axes[0, 0].set_ylabel('Brier Score (Lower is Better)')
                axes[0, 0].set_xticks(range(len(race_names)))
                axes[0, 0].set_xticklabels(race_names, rotation=45, ha='right')
                axes[0, 0].axhline(y=0.25, color='red', linestyle='--', alpha=0.7, label='Random (0.25)')
                axes[0, 0].legend()
            
            # 2. Driver prediction bias
            if driver_analysis is not None:
                top_drivers = driver_analysis.head(10)
                colors = ['red' if bias > 0 else 'blue' for bias in top_drivers['prediction_bias']]
                
                axes[0, 1].barh(range(len(top_drivers)), top_drivers['prediction_bias'], 
                               color=colors, alpha=0.7)
                axes[0, 1].set_title('Top 10 Driver Prediction Bias')
                axes[0, 1].set_xlabel('Prediction Bias (Predicted - Actual)')
                axes[0, 1].set_yticks(range(len(top_drivers)))
                axes[0, 1].set_yticklabels(top_drivers.index)
                axes[0, 1].axvline(x=0, color='black', linestyle='-', alpha=0.5)
            
            # 3. Overall metrics summary
            if metrics and 'overall' in metrics:
                overall = metrics['overall']
                metric_names = ['Brier Score', 'Log Loss']
                metric_values = [overall['brier_score'], overall['log_loss']]
                colors = ['lightcoral', 'lightblue']
                
                bars = axes[1, 0].bar(metric_names, metric_values, color=colors, alpha=0.7)
                axes[1, 0].set_title('Overall Model Performance')
                axes[1, 0].set_ylabel('Score (Lower is Better)')
                
                # Add value labels on bars
                for bar, value in zip(bars, metric_values):
                    height = bar.get_height()
                    axes[1, 0].text(bar.get_x() + bar.get_width()/2., height + 0.001,
                                   f'{value:.4f}', ha='center', va='bottom')
            
            # 4. Prediction vs Actual scatter
            if self.merged_df is not None:
                valid_data = self.merged_df[self.merged_df['actual'].notna()]
                axes[1, 1].scatter(valid_data['prediction'], valid_data['actual'], 
                                  alpha=0.6, color='green')
                axes[1, 1].plot([0, 1], [0, 1], 'r--', alpha=0.7, label='Perfect Prediction')
                axes[1, 1].set_title('Predicted vs Actual Win Probability')
                axes[1, 1].set_xlabel('Predicted Win Probability')
                axes[1, 1].set_ylabel('Actual Win (1=Win, 0=Loss)')
                axes[1, 1].legend()
            
            plt.tight_layout()
            
            # Save the plot
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            plot_filename = f"prediction_performance_analysis_{timestamp}.png"
            plt.savefig(plot_filename, dpi=300, bbox_inches='tight')
            print(f"  💾 Performance plot saved as {plot_filename}")
            
            plt.show()
            
        except Exception as e:
            print(f"  ⚠️  Could not create plots: {e}")
    
    def print_summary(self, metrics, driver_analysis):
        """Print a comprehensive summary of the evaluation"""
        print("\n" + "="*80)
        print("🏎️  F1 PREDICTION MODEL EVALUATION SUMMARY")
        print("="*80)
        
        if metrics and 'overall' in metrics:
            overall = metrics['overall']
            print(f"\n📊 OVERALL PERFORMANCE:")
            print(f"  • Total Predictions: {overall['total_predictions']}")
            print(f"  • Races Evaluated: {overall['races_count']}")
            print(f"  • Brier Score: {overall['brier_score']:.4f}")
            print(f"  • Log Loss: {overall['log_loss']:.4f}")
            
            # Interpret Brier Score
            if overall['brier_score'] < 0.1:
                brier_rating = "EXCELLENT"
            elif overall['brier_score'] < 0.2:
                brier_rating = "GOOD"
            elif overall['brier_score'] < 0.3:
                brier_rating = "FAIR"
            else:
                brier_rating = "POOR"
            print(f"  • Brier Score Rating: {brier_rating}")
        
        if metrics and 'per_race' in metrics:
            print(f"\n🏁 PER-RACE PERFORMANCE:")
            for race_metric in metrics['per_race']:
                print(f"  • {race_metric['race'].title()}: Brier={race_metric['brier_score']:.4f}, "
                      f"Log Loss={race_metric['log_loss']:.4f}")
        
        if driver_analysis is not None:
            print(f"\n👥 DRIVER ANALYSIS:")
            print("  Top 5 Overestimated Drivers:")
            overestimated = driver_analysis[driver_analysis['prediction_bias'] > 0.1].head(5)
            for driver, row in overestimated.iterrows():
                print(f"    • {driver}: Bias +{row['prediction_bias']:.3f}")
            
            print("  Top 5 Underestimated Drivers:")
            underestimated = driver_analysis[driver_analysis['prediction_bias'] < -0.1].head(5)
            for driver, row in underestimated.iterrows():
                print(f"    • {driver}: Bias {row['prediction_bias']:.3f}")
        
        print(f"\n💾 Data saved to 'prediction_vs_actual.csv'")
        print("="*80)
    
    def save_results(self):
        """Save all results to CSV files"""
        if self.merged_df is not None:
            # Save merged data
            self.merged_df.to_csv("prediction_vs_actual.csv", index=False)
            print("  💾 Saved merged data to prediction_vs_actual.csv")
            
            # Save driver analysis if available
            if hasattr(self, 'driver_analysis') and self.driver_analysis is not None:
                self.driver_analysis.to_csv("driver_performance_analysis.csv")
                print("  💾 Saved driver analysis to driver_performance_analysis.csv")

def main():
    """Main function to run the automated evaluation"""
    print("🏎️  F1 Prediction Model Automated Evaluation")
    print("="*60)
    
    # Initialize evaluator
    evaluator = F1PredictionEvaluator()
    
    # Load predictions (try multiple sources)
    predictions_loaded = False
    
    # Try to load from multi-race predictions first, then fallback to single race
    if evaluator.load_ml_predictions("csv", "multi_race_predictions.csv"):
        predictions_loaded = True
    elif evaluator.load_ml_predictions("csv", "monte_carlo_results.csv"):
        predictions_loaded = True
    elif evaluator.load_ml_predictions("csv", "test_predictions.csv"):
        predictions_loaded = True
    else:
        print("❌ Could not load predictions from any source")
        print("   Please run generate_multi_race_predictions.py first to generate predictions")
        return
    
    # Load actual results (try multiple sources)
    results_loaded = False
    
    if evaluator.load_actual_results("csv", "2025_race_results.csv"):
        results_loaded = True
    elif evaluator.load_actual_results("wiki"):
        results_loaded = True
    else:
        print("❌ Could not load actual results from any source")
        print("   Please ensure 2025_race_results.csv exists or internet connection is available")
        return
    
    # Merge and evaluate
    if evaluator.merge_predictions_and_results():
        # Calculate metrics
        metrics = evaluator.calculate_metrics()
        
        # Analyze driver performance
        driver_analysis = evaluator.analyze_driver_performance()
        
        # Create visualizations
        evaluator.plot_performance_analysis(metrics, driver_analysis)
        
        # Print summary
        evaluator.print_summary(metrics, driver_analysis)
        
        # Save results
        evaluator.save_results()
        
        print("\n✅ Evaluation complete!")
    else:
        print("❌ Failed to merge predictions with results")

if __name__ == "__main__":
    main()
