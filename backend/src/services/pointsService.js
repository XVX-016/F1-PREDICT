export async function updateUserPointsAndRefill(userId, newBalance, refillTime) {
  await db.query(
    "UPDATE users SET points_balance = $1, last_refill = $2 WHERE id = $3",
    [newBalance, refillTime, userId]
  );
  await logTransaction(userId, newBalance, "auto_refill");
}