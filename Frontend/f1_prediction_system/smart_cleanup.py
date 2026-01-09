#!/usr/bin/env python3
"""
Smart Cleanup for F1 Prediction System
Saves compact calibrated results and cleans up bulky raw files
Prevents project bloat while preserving essential data
"""

import pandas as pd
import numpy as np
from pathlib import Path
import shutil
import json
from datetime import datetime
import argparse

# Configuration
DEFAULT_MAX_RACES = 5
DEFAULT_ARCHIVE_OLD = False

class SmartCleanup:
    def __init__(self, max_races=DEFAULT_MAX_RACES, archive_old=DEFAULT_ARCHIVE_OLD):
        """Initialize cleanup with configuration"""
        self.max_races = max_races
        self.archive_old = archive_old
        
        # Paths
        self.raw_file = Path("calibrated_results_raw.csv")
        self.out_dir = Path("final_predictions")
        self.raw_dir = Path("raw_dumps")
        self.archive_dir = Path("archived_results")
        
        # Create output directories
        self.out_dir.mkdir(parents=True, exist_ok=True)
        if self.archive_old:
            self.archive_dir.mkdir(parents=True, exist_ok=True)
    
    def load_raw_results(self):
        """Load raw calibrated results"""
        if not self.raw_file.exists():
            print(f"❌ Raw results file not found: {self.raw_file}")
            return None
        
        try:
            results = pd.read_csv(self.raw_file)
            print(f"✅ Loaded raw results: {len(results)} records")
            return results
        except Exception as e:
            print(f"❌ Error loading raw results: {e}")
            return None
    
    def create_compact_results(self, results):
        """Create compact version with only essential fields"""
        print("📦 Creating compact results...")
        
        # Identify essential columns
        essential_cols = []
        for col in results.columns:
            if any(keyword in col.lower() for keyword in [
                'race', 'driver', 'team', 'win_prob', 'podium_prob', 'points_prob'
            ]):
                essential_cols.append(col)
        
        # If no essential columns found, use basic ones
        if not essential_cols:
            essential_cols = ['race', 'driver', 'team', 'win_prob']
        
        # Create compact dataframe
        compact = results[essential_cols].copy()
        
        # Clean up any NaN values
        compact = compact.fillna(0)
        
        print(f"  Kept {len(essential_cols)} essential columns")
        print(f"  Compact shape: {compact.shape}")
        
        return compact
    
    def save_compact_results(self, compact, race_id):
        """Save compact results for a specific race"""
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"results_{race_id}_{timestamp}.csv"
        out_file = self.out_dir / filename
        
        # Save compact results
        compact.to_csv(out_file, index=False)
        print(f"✅ Saved compact results: {out_file}")
        
        # Also save a "latest" version
        latest_file = self.out_dir / f"latest_{race_id}.csv"
        compact.to_csv(latest_file, index=False)
        print(f"✅ Saved latest results: {latest_file}")
        
        return out_file
    
    def cleanup_raw_files(self):
        """Delete bulky raw files to prevent project bloat"""
        print("🧹 Cleaning up raw files...")
        
        deleted_files = []
        
        # Delete raw calibrated results file
        if self.raw_file.exists():
            self.raw_file.unlink()
            deleted_files.append(str(self.raw_file))
            print(f"  Deleted: {self.raw_file}")
        
        # Delete raw dumps directory
        if self.raw_dir.exists():
            shutil.rmtree(self.raw_dir)
            deleted_files.append(str(self.raw_dir))
            print(f"  Deleted: {self.raw_dir}")
        
        # Delete other potential bulky files
        bulky_patterns = [
            "monte_carlo_*.csv",
            "calibration_*.csv", 
            "raw_*.csv",
            "temp_*.csv",
            "debug_*.csv"
        ]
        
        for pattern in bulky_patterns:
            for file_path in Path(".").glob(pattern):
                if file_path.is_file() and file_path.stat().st_size > 1024 * 1024:  # > 1MB
                    file_path.unlink()
                    deleted_files.append(str(file_path))
                    print(f"  Deleted bulky file: {file_path}")
        
        print(f"  Total files deleted: {len(deleted_files)}")
        return deleted_files
    
    def manage_race_history(self):
        """Keep only the last N races, optionally archive old ones"""
        print(f"📚 Managing race history (keeping last {self.max_races} races)...")
        
        # Find all result files
        result_files = list(self.out_dir.glob("results_*.csv"))
        
        if len(result_files) <= self.max_races:
            print(f"  Only {len(result_files)} races found, no cleanup needed")
            return
        
        # Sort by modification time (newest first)
        result_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
        
        # Files to keep vs. remove
        files_to_keep = result_files[:self.max_races]
        files_to_remove = result_files[self.max_races:]
        
        print(f"  Keeping: {len(files_to_keep)} races")
        print(f"  Removing: {len(files_to_remove)} races")
        
        for file_path in files_to_remove:
            if self.archive_old:
                # Archive old file
                archive_path = self.archive_dir / file_path.name
                shutil.move(str(file_path), str(archive_path))
                print(f"  Archived: {file_path} → {archive_path}")
            else:
                # Delete old file
                file_path.unlink()
                print(f"  Deleted: {file_path}")
    
    def create_cleanup_summary(self, compact_file, deleted_files):
        """Create a summary of the cleanup operation"""
        summary = {
            "cleanup_date": datetime.now().isoformat(),
            "max_races_kept": self.max_races,
            "archive_old": self.archive_old,
            "compact_file": str(compact_file),
            "deleted_files": deleted_files,
            "total_space_saved_mb": sum(
                Path(f).stat().st_size for f in deleted_files if Path(f).exists()
            ) / (1024 * 1024) if deleted_files else 0
        }
        
        # Save summary
        summary_file = self.out_dir / "cleanup_summary.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"📊 Cleanup summary saved: {summary_file}")
        return summary
    
    def run_cleanup(self):
        """Run the complete cleanup pipeline"""
        print("🚀 Starting Smart Cleanup Pipeline")
        print("=" * 50)
        
        # Load raw results
        results = self.load_raw_results()
        if results is None:
            return False
        
        # Create compact results
        compact = self.create_compact_results(results)
        
        # Extract race ID
        race_col = next((col for col in compact.columns if 'race' in col.lower()), 'race')
        if race_col in compact.columns:
            race_id = compact[race_col].iloc[0]
        else:
            race_id = "unknown_race"
        
        # Save compact results
        compact_file = self.save_compact_results(compact, race_id)
        
        # Cleanup raw files
        deleted_files = self.cleanup_raw_files()
        
        # Manage race history
        self.manage_race_history()
        
        # Create summary
        summary = self.create_cleanup_summary(compact_file, deleted_files)
        
        print("\n🎉 Smart Cleanup Completed Successfully!")
        print(f"📁 Compact results saved to: {self.out_dir}")
        print(f"🧹 Deleted {len(deleted_files)} bulky files")
        print(f"💾 Kept last {self.max_races} races")
        
        if self.archive_old:
            print(f"📦 Old races archived to: {self.archive_dir}")
        
        return True

def main():
    """Main entry point with command line arguments"""
    parser = argparse.ArgumentParser(description="Smart Cleanup for F1 Prediction System")
    parser.add_argument("--max-races", type=int, default=DEFAULT_MAX_RACES,
                       help=f"Maximum number of races to keep (default: {DEFAULT_MAX_RACES})")
    parser.add_argument("--archive", action="store_true", default=DEFAULT_ARCHIVE_OLD,
                       help="Archive old races instead of deleting them")
    
    args = parser.parse_args()
    
    # Run cleanup
    cleanup = SmartCleanup(
        max_races=args.max_races,
        archive_old=args.archive
    )
    
    success = cleanup.run_cleanup()
    
    if not success:
        print("❌ Cleanup failed!")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
