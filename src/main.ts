import "./css/style.css";
import "./css/typography.css";
import { initPWA } from "./ts/pwa";

// Initialize PWA functionality
initPWA();

const colors = ["#3674B5", "#FBA518", "#5B913B", "#BE3144"];

// Assignment to week mapping
const assignmentWeekMap: Record<string, number[]> = {
  // show: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], // Friction in Methods (all weeks)
  composing: [2, 3, 4, 5], // Composing Space(s)
  // research: [5, 6], // Designer Research
  poster: [6, 7], // Found Poster
  film: [7, 8, 9], // Film Invite
  document: [9, 10, 11], // Collecting-Documenting
  collate: [11, 12, 13, 14], // Collecting-Collating
};

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
  styleActiveAssignment();
  styleScheduleWeeks();
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

// Get a consistent color for a specific assignment or week
function getAssignmentColor(key: string): string {
  // Use a hash function to generate a consistent index based on the key
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i)) % colors.length;
  }
  return colors[hash];
}

function styleActiveAssignment() {
  // Process all assignments
  document.querySelectorAll(".assignments > details").forEach((detail) => {
    const detailEl = detail as HTMLDetailsElement;
    const className = Array.from(detailEl.classList).find(
      (cls) => cls !== "assignments" && cls !== "show"
    );

    if (className) {
      const color = getAssignmentColor(className);

      // Apply color to the assignment details
      detailEl.style.borderLeft = `4px solid ${color}`;

      // If this is the "show" class (Friction in Methods), make sure it's open
      if (detailEl.classList.contains("show")) {
        detailEl.open = true;

        // Style the active exercise within this assignment
        const activeExercise = detailEl.querySelector(
          ".active"
        ) as HTMLElement | null;
        if (activeExercise) {
          activeExercise.style.borderLeft = `4px solid ${color}`;
          activeExercise.style.paddingLeft = "12px";
          activeExercise.style.backgroundColor = `${color}10`;
        }
      }
    }
  });
}

function styleScheduleWeeks() {
  // Process all weeks in the schedule
  document
    .querySelectorAll(".schedule > details.week")
    .forEach((weekDetail) => {
      const weekDetailEl = weekDetail as HTMLDetailsElement;
      const weekMatch = weekDetailEl.className.match(/week--(\d+)/);

      if (weekMatch) {
        const weekNumber = parseInt(weekMatch[1]);

        // Find which assignments are active during this week
        const activeAssignments: string[] = [];

        for (const [assignmentClass, weeks] of Object.entries(
          assignmentWeekMap
        )) {
          if (weeks.includes(weekNumber)) {
            const color = getAssignmentColor(assignmentClass);
            activeAssignments.push(assignmentClass);

            // Apply color to week element (use the first matching assignment's color)
            if (activeAssignments.length === 1) {
              weekDetailEl.style.borderLeft = `4px solid ${color}`;
              weekDetailEl.style.borderRadius = "4px";
            }
          }
        }

        // Add tooltip showing active assignments for this week
        if (activeAssignments.length > 0) {
          // Get readable names for the assignments
          const assignmentNames = activeAssignments
            .map((className) => {
              // Convert className to a readable name
              const element = document.querySelector(
                `.assignments > details.${className}`
              );
              if (element) {
                const summary = element.querySelector("summary");
                return summary ? summary.textContent?.trim() : className;
              }
              return className;
            })
            .filter((name) => name);

          // Set tooltip
          weekDetailEl.title = `Assignments: ${assignmentNames.join(", ")}`;

          // Add a data attribute with active assignment classes
          weekDetailEl.setAttribute(
            "data-assignments",
            activeAssignments.join(" ")
          );

          // Add click event to highlight related assignments
          weekDetailEl.addEventListener("click", () => {
            // Reset all assignment highlights
            document
              .querySelectorAll(".assignments > details")
              .forEach((detail) => {
                (detail as HTMLElement).classList.remove("highlighted");
              });

            // Highlight related assignments
            for (const className of activeAssignments) {
              const assignmentEl = document.querySelector(
                `.assignments > details.${className}`
              );
              if (assignmentEl) {
                assignmentEl.classList.add("highlighted");
                // If it's not already open, open it
                (assignmentEl as HTMLDetailsElement).open = true;
              }
            }

            // Remove highlight after a delay
            setTimeout(() => {
              document
                .querySelectorAll(".assignments > details.highlighted")
                .forEach((detail) => {
                  detail.classList.remove("highlighted");
                });
            }, 2000);
          });
        }
      }
    });
}
