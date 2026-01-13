import { useState, useMemo, useCallback } from "react";

// Helper to get week boundaries
function getWeekBoundaries(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 4); // Friday
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function formatWeekLabel(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

export function useCalendarNavigation() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const { weekStart, weekEnd, weekLabel, weekDays } = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + currentWeekOffset * 7);
    const { start, end } = getWeekBoundaries(today);

    const days: { name: string; date: Date; isToday: boolean }[] = [];
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const realToday = new Date();
    realToday.setHours(0, 0, 0, 0);

    for (let i = 0; i < 5; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push({
        name: dayNames[i],
        date,
        isToday: date.getTime() === realToday.getTime(),
      });
    }

    return {
      weekStart: start,
      weekEnd: end,
      weekLabel: formatWeekLabel(start, end),
      weekDays: days,
    };
  }, [currentWeekOffset]);

  const goToPreviousWeek = useCallback(() => {
    setCurrentWeekOffset((prev) => prev - 1);
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeekOffset((prev) => prev + 1);
  }, []);

  const goToToday = useCallback(() => {
    setCurrentWeekOffset(0);
  }, []);

  return {
    currentWeekOffset,
    weekStart,
    weekEnd,
    weekLabel,
    weekDays,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
  };
}
