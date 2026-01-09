"""
Betting Lifecycle Scheduler
Automatically runs betting lifecycle management every 5 minutes using APScheduler
"""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
from datetime import datetime, timezone
import atexit
import os
import sys

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.BettingLifecycleService import betting_lifecycle_service

logger = logging.getLogger(__name__)

class BettingScheduler:
    """
    Scheduler for automatic betting lifecycle management.
    Runs every 5 minutes to check for race events and manage betting markets.
    """
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.is_running = False
        self.job_id = "betting_lifecycle"
        
        # Set up event listeners
        self.scheduler.add_listener(self._job_executed, EVENT_JOB_EXECUTED)
        self.scheduler.add_listener(self._job_error, EVENT_JOB_ERROR)
        
        # Register cleanup function
        atexit.register(self.shutdown)
        
        logger.info("✅ BettingScheduler initialized")

    def start(self):
        """Start the scheduler"""
        try:
            if not self.is_running:
                # Add the betting lifecycle job to run every 5 minutes
                self.scheduler.add_job(
                    func=self._run_lifecycle,
                    trigger=IntervalTrigger(minutes=5),
                    id=self.job_id,
                    name="Betting Lifecycle Management",
                    replace_existing=True,
                    max_instances=1,  # Prevent overlapping executions
                    coalesce=True     # Combine multiple pending executions
                )
                
                # Add a daily status check at 9 AM UTC
                self.scheduler.add_job(
                    func=self._daily_status_check,
                    trigger=CronTrigger(hour=9, minute=0, timezone='UTC'),
                    id="daily_status_check",
                    name="Daily Status Check",
                    replace_existing=True
                )
                
                self.scheduler.start()
                self.is_running = True
                logger.info("🚀 BettingScheduler started - running every 5 minutes")
                return True
            else:
                logger.warning("⚠️ Scheduler is already running")
                return False
        except Exception as e:
            logger.error(f"❌ Failed to start scheduler: {e}")
            return False

    def stop(self):
        """Stop the scheduler"""
        try:
            if self.is_running:
                self.scheduler.shutdown(wait=True)
                self.is_running = False
                logger.info("🛑 BettingScheduler stopped")
                return True
            else:
                logger.warning("⚠️ Scheduler is not running")
                return False
        except Exception as e:
            logger.error(f"❌ Failed to stop scheduler: {e}")
            return False

    def shutdown(self):
        """Clean shutdown of the scheduler"""
        if self.is_running:
            logger.info("🔄 Shutting down BettingScheduler...")
            self.stop()

    def _run_lifecycle(self):
        """Execute the betting lifecycle management"""
        try:
            logger.info("🔄 Executing betting lifecycle check...")
            result = betting_lifecycle_service.run_lifecycle()
            
            if result["status"] == "success":
                logger.info("✅ Betting lifecycle check completed successfully")
            elif result["status"] == "warning":
                logger.warning(f"⚠️ Betting lifecycle check completed with warnings: {result.get('message', '')}")
            else:
                logger.error(f"❌ Betting lifecycle check failed: {result.get('message', '')}")
                
            return result
        except Exception as e:
            logger.error(f"❌ Error in betting lifecycle execution: {e}")
            return {
                "status": "error",
                "message": f"Execution error: {str(e)}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def _daily_status_check(self):
        """Daily status check and reporting"""
        try:
            logger.info("📊 Running daily status check...")
            status = betting_lifecycle_service.get_lifecycle_status()
            
            if status["status"] == "success":
                logger.info("✅ Daily status check completed")
                # Here you could send status reports, notifications, etc.
            else:
                logger.error(f"❌ Daily status check failed: {status.get('message', '')}")
                
            return status
        except Exception as e:
            logger.error(f"❌ Error in daily status check: {e}")
            return {
                "status": "error",
                "message": f"Status check error: {str(e)}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def _job_executed(self, event):
        """Handle successful job execution"""
        job_id = event.job_id
        execution_time = datetime.fromtimestamp(event.scheduled_run_time, tz=timezone.utc)
        logger.info(f"✅ Job '{job_id}' executed successfully at {execution_time}")

    def _job_error(self, event):
        """Handle job execution errors"""
        job_id = event.job_id
        exception = event.exception
        execution_time = datetime.fromtimestamp(event.scheduled_run_time, tz=timezone.utc)
        logger.error(f"❌ Job '{job_id}' failed at {execution_time}: {exception}")

    def get_scheduler_status(self):
        """Get current scheduler status"""
        try:
            jobs = []
            for job in self.scheduler.get_jobs():
                jobs.append({
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                    "trigger": str(job.trigger)
                })
            
            return {
                "status": "success",
                "scheduler_running": self.is_running,
                "jobs": jobs,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"❌ Failed to get scheduler status: {e}")
            return {
                "status": "error",
                "message": f"Failed to get status: {str(e)}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def trigger_manual_lifecycle(self):
        """Manually trigger a lifecycle check"""
        try:
            logger.info("🔧 Manual lifecycle trigger requested")
            result = self._run_lifecycle()
            return result
        except Exception as e:
            logger.error(f"❌ Manual lifecycle trigger failed: {e}")
            return {
                "status": "error",
                "message": f"Manual trigger failed: {str(e)}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def update_schedule(self, interval_minutes: int = 5):
        """Update the scheduling interval"""
        try:
            if self.is_running:
                # Remove existing job
                self.scheduler.remove_job(self.job_id)
                
                # Add new job with updated interval
                self.scheduler.add_job(
                    func=self._run_lifecycle,
                    trigger=IntervalTrigger(minutes=interval_minutes),
                    id=self.job_id,
                    name="Betting Lifecycle Management",
                    replace_existing=True,
                    max_instances=1,
                    coalesce=True
                )
                
                logger.info(f"✅ Schedule updated to run every {interval_minutes} minutes")
                return True
            else:
                logger.warning("⚠️ Cannot update schedule - scheduler not running")
                return False
        except Exception as e:
            logger.error(f"❌ Failed to update schedule: {e}")
            return False


# Global scheduler instance
betting_scheduler = BettingScheduler()

# Convenience functions for easy integration
def start_betting_scheduler():
    """Start the betting scheduler"""
    return betting_scheduler.start()

def stop_betting_scheduler():
    """Stop the betting scheduler"""
    return betting_scheduler.stop()

def get_scheduler_status():
    """Get scheduler status"""
    return betting_scheduler.get_scheduler_status()

def trigger_manual_lifecycle():
    """Manually trigger lifecycle check"""
    return betting_scheduler.trigger_manual_lifecycle()

