#!/usr/bin/env python3
"""
F1 Betting Lifecycle Background Service
Starts the automatic betting lifecycle management system
Runs every 5 minutes to manage betting markets automatically
"""

import os
import sys
import logging
import signal
import time
from datetime import datetime, timezone

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.BettingScheduler import betting_scheduler, start_betting_scheduler, get_scheduler_status
from services.BettingLifecycleService import betting_lifecycle_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/betting_lifecycle.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BettingLifecycleDaemon:
    """Background daemon for betting lifecycle management"""
    
    def __init__(self):
        self.running = False
        self.scheduler_started = False
        
    def start(self):
        """Start the betting lifecycle daemon"""
        try:
            logger.info("🚀 Starting F1 Betting Lifecycle Daemon...")
            
            # Set up signal handlers for graceful shutdown
            signal.signal(signal.SIGINT, self._signal_handler)
            signal.signal(signal.SIGTERM, self._signal_handler)
            
            # Start the scheduler
            if start_betting_scheduler():
                self.scheduler_started = True
                self.running = True
                logger.info("✅ Betting Lifecycle Daemon started successfully")
                logger.info("🔄 Scheduler running every 5 minutes")
                
                # Run initial lifecycle check
                logger.info("🔧 Running initial lifecycle check...")
                initial_result = betting_lifecycle_service.run_lifecycle()
                logger.info(f"📊 Initial check result: {initial_result['status']}")
                
                # Keep the daemon running
                self._keep_alive()
            else:
                logger.error("❌ Failed to start betting scheduler")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to start daemon: {e}")
            return False
    
    def stop(self):
        """Stop the betting lifecycle daemon"""
        try:
            logger.info("🛑 Stopping F1 Betting Lifecycle Daemon...")
            self.running = False
            
            if self.scheduler_started:
                betting_scheduler.stop()
                self.scheduler_started = False
                
            logger.info("✅ Betting Lifecycle Daemon stopped")
            return True
        except Exception as e:
            logger.error(f"❌ Error stopping daemon: {e}")
            return False
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"📡 Received signal {signum}, shutting down gracefully...")
        self.stop()
        sys.exit(0)
    
    def _keep_alive(self):
        """Keep the daemon running and monitor status"""
        try:
            while self.running:
                # Check scheduler status every minute
                status = get_scheduler_status()
                if status["status"] == "success":
                    if not status["scheduler_running"]:
                        logger.warning("⚠️ Scheduler stopped unexpectedly, restarting...")
                        if start_betting_scheduler():
                            logger.info("✅ Scheduler restarted successfully")
                        else:
                            logger.error("❌ Failed to restart scheduler")
                            self.running = False
                            break
                
                # Sleep for 1 minute before next check
                time.sleep(60)
                
        except KeyboardInterrupt:
            logger.info("📡 Keyboard interrupt received")
            self.stop()
        except Exception as e:
            logger.error(f"❌ Error in keep-alive loop: {e}")
            self.stop()
    
    def get_status(self):
        """Get current daemon status"""
        try:
            scheduler_status = get_scheduler_status()
            lifecycle_status = betting_lifecycle_service.get_lifecycle_status()
            
            return {
                "daemon_running": self.running,
                "scheduler_started": self.scheduler_started,
                "scheduler_status": scheduler_status,
                "lifecycle_status": lifecycle_status,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"❌ Failed to get status: {e}")
            return {
                "daemon_running": self.running,
                "scheduler_started": self.scheduler_started,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

def main():
    """Main entry point"""
    print("🏎️ F1 Betting Lifecycle Background Service")
    print("=" * 50)
    print("This service will:")
    print("• Close markets automatically at race start")
    print("• Settle bets after race results")
    print("• Generate new markets for next GP")
    print("• Run every 5 minutes in the background")
    print("=" * 50)
    
    # Create logs directory if it doesn't exist
    os.makedirs('backend/logs', exist_ok=True)
    
    # Start the daemon
    daemon = BettingLifecycleDaemon()
    
    try:
        daemon.start()
    except KeyboardInterrupt:
        logger.info("📡 Shutdown requested by user")
        daemon.stop()
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        daemon.stop()
        sys.exit(1)

if __name__ == "__main__":
    main()
