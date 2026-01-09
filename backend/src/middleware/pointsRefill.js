import { getUserPoints, updateUserPointsAndRefill } from "../services/pointsService.js";

const REFILL_AMOUNT = 1000;
const REFILL_INTERVAL_HOURS = 4;
const MAX_POINTS = 20000;

export default async function pointsRefill(req, res, next) {
  if (!req.user?.id) return next();

  try {
    const { points_balance, last_refill } = await getUserPoints(req.user.id);
    const now = new Date();
    const last = new Date(last_refill);
    const msPassed = now - last;
    const hoursPassed = msPassed / (1000 * 60 * 60);

    if (hoursPassed >= REFILL_INTERVAL_HOURS) {
      // Calculate how many intervals have passed
      const intervals = Math.floor(hoursPassed / REFILL_INTERVAL_HOURS);
      let pointsToAdd = intervals * REFILL_AMOUNT;
      let newBalance = Math.min(points_balance + pointsToAdd, MAX_POINTS);

      // Only add up to the max
      pointsToAdd = newBalance - points_balance;

      if (pointsToAdd > 0) {
        await updateUserPointsAndRefill(req.user.id, newBalance, now);
        // Attach a greeting message to the response
        res.locals.refillMessage = `Congratulations! ${pointsToAdd} points have been added to your account.`;
      }
    }
  } catch (err) {
    // Log error but don't block the request
    console.error("Points refill error:", err);
  }
  next();
}