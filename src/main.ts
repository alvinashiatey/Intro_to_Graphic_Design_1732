import "./css/style.css";
import "./css/typography.css";

const colors = ["#3674B5", "#FBA518", "#5B913B", "#BE3144"];

const randomAnchorColor = () =>
  colors[Math.floor(Math.random() * colors.length)];
const setRandomAnchorColor = () => {
  document.documentElement.style.setProperty(
    "--anchor-color",
    randomAnchorColor()
  );
};

window.addEventListener("load", () => {
  setRandomAnchorColor();
  openUpcomingSchedule();
});

function openUpcomingSchedule() {
  const scheduleRoot = document.querySelector(".schedule");
  if (!scheduleRoot) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // All session summaries inside week containers
  const summaryNodes = scheduleRoot.querySelectorAll<HTMLElement>(
    "details.week > details > summary"
  );

  type SessionEntry = {
    date: Date;
    summaryEl: HTMLElement;
    sessionDetails: HTMLDetailsElement;
    weekDetails: HTMLDetailsElement;
  };

  const weekdayRegex =
    /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+/i;

  const sessions: SessionEntry[] = Array.from(summaryNodes)
    .map((summaryEl) => {
      const raw = (summaryEl.textContent || "").trim();
      const cleaned = raw.replace(weekdayRegex, ""); // e.g. "October 22"

      // Try with current year first
      const y = new Date().getFullYear();
      let parsed = new Date(`${cleaned}, ${y}`);

      // Fallback: if invalid, try previous and next year to be safe across year boundaries
      if (isNaN(parsed.getTime())) parsed = new Date(`${cleaned}, ${y - 1}`);
      if (isNaN(parsed.getTime())) parsed = new Date(`${cleaned}, ${y + 1}`);
      if (isNaN(parsed.getTime())) return null;

      const sessionDetails =
        summaryEl.parentElement as HTMLDetailsElement | null;
      const weekDetails = summaryEl.closest(
        "details.week"
      ) as HTMLDetailsElement | null;
      if (!sessionDetails || !weekDetails) return null;

      return {
        date: parsed,
        summaryEl,
        sessionDetails: sessionDetails!,
        weekDetails: weekDetails!,
      };
    })
    .filter((v): v is SessionEntry => v !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sessions.length === 0) return;

  // Find the next session that is today or in the future; otherwise, pick the last one
  const upcoming =
    sessions.find((s) => s.date.getTime() >= today.getTime()) ||
    sessions[sessions.length - 1];

  if (upcoming.weekDetails) {
    upcoming.weekDetails.open = true;
  }
  upcoming.sessionDetails.open = true;
}
