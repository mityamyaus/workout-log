/** Local calendar date as YYYY-MM-DD — never use toISOString() for "today", it's UTC and drifts a day for anyone east of UTC (all of Russia) right after local midnight. */
export function todayStr(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
