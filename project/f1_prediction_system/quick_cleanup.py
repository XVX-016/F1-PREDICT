#!/usr/bin/env python3
"""
Quick Cleanup - One-liner version
Simple cleanup without command line arguments
"""

from smart_cleanup import SmartCleanup

if __name__ == "__main__":
    # Quick cleanup with default settings
    cleanup = SmartCleanup(max_races=5, archive_old=False)
    cleanup.run_cleanup()
