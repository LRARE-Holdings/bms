import { slotRunsOn, isSlotInHoliday, ruleAppliesToDate } from "@/lib/schedule-rules"

let pass = 0, fail = 0
function check(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name} — got ${actual}, expected ${expected}`) }
}

// Wednesdays in Oct 2026: 7th, 14th, 21st, 28th. day_of_week 2 = Wed.
const fortnightly = { recurrence: "fortnightly", day_of_week: 2, starts_on: "2026-10-07", ends_on: null, is_active: true }
console.log("\nBUG 1 — fortnightly must skip alternate weeks:")
check("runs 7 Oct (week 0)",  slotRunsOn({ day_of_week: 2, rule: fortnightly }, "2026-10-07"), true)
check("SKIPS 14 Oct (week 1)", slotRunsOn({ day_of_week: 2, rule: fortnightly }, "2026-10-14"), false)
check("runs 21 Oct (week 2)", slotRunsOn({ day_of_week: 2, rule: fortnightly }, "2026-10-21"), true)
check("SKIPS 28 Oct (week 3)", slotRunsOn({ day_of_week: 2, rule: fortnightly }, "2026-10-28"), false)

const monthly = { recurrence: "monthly", day_of_week: 2, starts_on: "2026-10-07", ends_on: null, is_active: true }
console.log("\nBUG 1 — monthly must run only the same nth weekday:")
check("runs 7 Oct (1st Wed)",   slotRunsOn({ day_of_week: 2, rule: monthly }, "2026-10-07"), true)
check("SKIPS 14 Oct (2nd Wed)", slotRunsOn({ day_of_week: 2, rule: monthly }, "2026-10-14"), false)
check("runs 4 Nov (1st Wed)",   slotRunsOn({ day_of_week: 2, rule: monthly }, "2026-11-04"), true)

console.log("\nBUG 2 — a paused rule must not be bookable:")
const paused = { ...fortnightly, recurrence: "weekly", is_active: false }
check("paused rule hidden", slotRunsOn({ day_of_week: 2, rule: paused }, "2026-10-07"), false)
check("same rule active",   slotRunsOn({ day_of_week: 2, rule: { ...paused, is_active: true } }, "2026-10-07"), true)

console.log("\nBUG 3 — a half-day holiday must close only its window:")
const partial = [{ start_date: "2026-10-07", end_date: "2026-10-07", start_time: "12:00:00", end_time: "15:00:00" }]
check("10:00 class unaffected", isSlotInHoliday(partial, "2026-10-07", "10:00:00"), false)
check("13:00 class closed",     isSlotInHoliday(partial, "2026-10-07", "13:00:00"), true)
check("15:00 class unaffected (end exclusive)", isSlotInHoliday(partial, "2026-10-07", "15:00:00"), false)
check("18:30 class unaffected", isSlotInHoliday(partial, "2026-10-07", "18:30:00"), false)
const fullDay = [{ start_date: "2026-10-07", end_date: "2026-10-07", start_time: null, end_time: null }]
check("full-day holiday closes 10:00", isSlotInHoliday(fullDay, "2026-10-07", "10:00:00"), true)
check("full-day holiday closes 18:30", isSlotInHoliday(fullDay, "2026-10-07", "18:30:00"), true)

console.log("\nGuards still hold — window and weekday:")
check("before starts_on", ruleAppliesToDate({ ...fortnightly, recurrence: "weekly" }, "2026-10-06"), false)
check("after ends_on",    ruleAppliesToDate({ recurrence: "weekly", day_of_week: 2, starts_on: "2026-10-07", ends_on: "2026-10-14", is_active: true }, "2026-10-21"), false)
check("wrong weekday",    slotRunsOn({ day_of_week: 2, rule: null }, "2026-10-08"), false)
check("no rule = standing weekly", slotRunsOn({ day_of_week: 2, rule: null }, "2026-10-07"), true)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
