// OpenF1 API has been removed
// This service is no longer used as the app now uses:
// - Jolpica for historical F1 data and ML training
// - Fast-F1 for track features and additional data

// If you need to restore OpenF1 functionality in the future,
// you can uncomment and modify the endpoints below

/*
export async function getSchedule(year = new Date().getFullYear()) {
  const res = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`);
  return res.json();
}

export async function getNextSession() {
  const schedule = await getSchedule();
  // Implementation for getting next session
  return schedule;
}

export async function getDriverPositions(session_key) {
  const res = await fetch(`https://api.openf1.org/v1/position?session_key=${session_key}`);
  return res.json();
}

export async function getLapTimes(session_key) {
  const res = await fetch(`https://api.openf1.org/v1/lap_count?session_key=${session_key}`);
  return res.json();
}
*/ 