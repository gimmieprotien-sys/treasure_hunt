
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvekiQyTgNrjgpgd_rOcXR0ABmmnkTMqSNXueAl8Wa0po1WubIfGmcFx4QSa_rC8wd/exec";


// ── Clues list ──────────────────────────────────────────────
//  Add, remove, or edit clues here.
//  Each clue has:
//    clue  → the riddle shown to the team
//    code  → the passcode hidden at that location (case-insensitive)
const clues = [
  {
    clue: "I hold thousands of stories but never speak a word. My shelves stretch to the ceiling. Find the entrance and look behind the welcome sign.",
    code: "LIB247"
  },
  {
    clue: "Students gather here when thirsty between classes. Machines hum and drip liquid life. Look below the machine near the east wall.",
    code: "H2O555"
  },
  {
    clue: "Future programmers spend countless hours staring at glowing screens here. Find the lab and check near the instructor's desk.",
    code: "CODE404"
  },
  {
    clue: "Campus announcements live here — flyers, notices, and lost-and-found. Search the bottom-left corner of the main board.",
    code: "INFO321"
  }
];


// ── Scoring constants ────────────────────────────────────────
const BASE_SCORE    = 20;   // Points before any penalty
const PENALTY_RATE  = 2;    // Points deducted per interval
const PENALTY_EVERY = 5;    // Minutes per interval (every 5 min = -2 pts)


// ════════════════════════════════════════════════════════════
//  SECTION 2 — GAME STATE
//  These variables remember what is happening during the game.
// ════════════════════════════════════════════════════════════

let teamName      = "";      // Name the team entered
let selectedClue  = null;    // The clue object randomly chosen
let timerInterval = null;    // Reference to the setInterval loop
let elapsedSeconds = 0;      // How many seconds have passed


// ════════════════════════════════════════════════════════════
//  SECTION 3 — TIMER
// ════════════════════════════════════════════════════════════

// Starts the countdown timer. Called when hunt begins.
function startTimer() {
  elapsedSeconds = 0;
  updateTimerDisplay();   // Show 00:00 immediately

  // setInterval calls the function every 1000 ms (1 second)
  timerInterval = setInterval(function () {
    elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}

// Stops the timer. Called when the correct passcode is entered.
function stopTimer() {
  clearInterval(timerInterval);
}

// Formats seconds into MM:SS and puts it on the page.
function updateTimerDisplay() {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  // padStart(2, "0") adds a leading zero → 3 becomes "03"
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  document.getElementById("timer-display").textContent = mm + ":" + ss;
}

// Returns elapsed time as a human-readable string, e.g. "6m 32s"
function formatElapsedTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m + "m " + s + "s";
}


// ════════════════════════════════════════════════════════════
//  SECTION 4 — SCREEN HELPERS
//  The app has three "screens" (divs). Only one is visible at
//  a time. showScreen() switches between them.
// ════════════════════════════════════════════════════════════

function showScreen(id) {
  // Hide ALL screens first
  document.querySelectorAll(".screen").forEach(function (el) {
    el.classList.remove("active");
  });

  // Then show only the requested screen
  document.getElementById(id).classList.add("active");

  // Scroll back to top (important on mobile)
  window.scrollTo({ top: 0, behavior: "smooth" });
}


// ════════════════════════════════════════════════════════════
//  SECTION 5 — START HUNT
//  Called when the team clicks "Start Hunt".
// ════════════════════════════════════════════════════════════

function startHunt() {
  // Read whatever is in the team name input box
  const input = document.getElementById("team-name").value.trim();

  // Validate: don't allow an empty name
  if (!input) {
    document.getElementById("start-error").classList.remove("hidden");
    document.getElementById("team-name").focus();
    return;   // Stop here; don't start the hunt
  }

  // Hide any previous error
  document.getElementById("start-error").classList.add("hidden");

  // Save the team name
  teamName = input;

  // Pick a random clue from the array
  // Math.random() gives a number between 0 and 1
  // Multiply by array length, then floor() rounds it down to an integer
  const randomIndex = Math.floor(Math.random() * clues.length);
  selectedClue = clues[randomIndex];

  // Fill the hunt screen with the team name and clue text
  document.getElementById("display-team").textContent = teamName;
  document.getElementById("clue-text").textContent    = selectedClue.clue;

  // Clear any old passcode input and errors from a previous attempt
  document.getElementById("passcode-input").value = "";
  document.getElementById("passcode-error").classList.add("hidden");
  document.getElementById("submit-btn").disabled = false;
  document.getElementById("passcode-input").disabled = false;

  // Switch to Screen 2
  showScreen("screen-hunt");

  // Start the timer AFTER the screen switch
  startTimer();
}


// ════════════════════════════════════════════════════════════
//  SECTION 6 — SUBMIT PASSCODE
//  Called when the team clicks "Submit" on Screen 2.
// ════════════════════════════════════════════════════════════

function submitPasscode() {
  // Read the passcode they typed, remove whitespace, make uppercase
  const entered = document.getElementById("passcode-input").value.trim().toUpperCase();
  const correct = selectedClue.code.toUpperCase();

  if (entered === correct) {
    // ── CORRECT ──────────────────────────────────────────
    stopTimer();

    // Disable input so they can't re-submit
    document.getElementById("submit-btn").disabled    = true;
    document.getElementById("passcode-input").disabled = true;

    // Calculate score and build result data
    const result = calculateScore(elapsedSeconds);

    // Show the result screen
    showResultScreen(result);

    // Send the data to Google Sheets
    sendToGoogleSheets(result);

  } else {
    // ── WRONG ────────────────────────────────────────────
    document.getElementById("passcode-error").classList.remove("hidden");

    // Clear input and focus it for retry
    document.getElementById("passcode-input").value = "";
    document.getElementById("passcode-input").focus();

    // Hide the error again after 3 seconds (quality-of-life touch)
    setTimeout(function () {
      document.getElementById("passcode-error").classList.add("hidden");
    }, 3000);
  }
}

// Allow pressing Enter key to submit passcode
document.getElementById("passcode-input").addEventListener("keydown", function (e) {
  if (e.key === "Enter") submitPasscode();
});

// Allow pressing Enter key to start hunt
document.getElementById("team-name").addEventListener("keydown", function (e) {
  if (e.key === "Enter") startHunt();
});


// ════════════════════════════════════════════════════════════
//  SECTION 7 — SCORING
// ════════════════════════════════════════════════════════════

// Returns an object with all score details.
// Example: { timeTaken: 370, minutes: 6, penalty: 2, finalScore: 18, ... }
function calculateScore(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);   // whole minutes only

  // How many complete 5-minute intervals have passed?
  // floor(6 / 5) = 1  →  penalty = 1 * 2 = 2 points off
  const penaltyIntervals = Math.floor(minutes / PENALTY_EVERY);
  const penalty          = penaltyIntervals * PENALTY_RATE;

  // Clamp so score can't go below 0
  const finalScore = Math.max(0, BASE_SCORE - penalty);

  return {
    teamName:    teamName,
    clueText:    selectedClue.clue,
    timeTaken:   formatElapsedTime(totalSeconds),  // "6m 32s"
    totalSeconds: totalSeconds,
    minutes:     minutes,
    penalty:     penalty,
    finalScore:  finalScore
  };
}


// ════════════════════════════════════════════════════════════
//  SECTION 8 — SHOW RESULT SCREEN
// ════════════════════════════════════════════════════════════

function showResultScreen(result) {
  // Fill in all the result values
  document.getElementById("result-team-name").textContent = "Team: " + result.teamName;
  document.getElementById("result-time").textContent      = result.timeTaken;
  document.getElementById("result-penalty").textContent   = result.penalty > 0
    ? "-" + result.penalty + " pts"
    : "None 🎉";
  document.getElementById("result-score").textContent     = result.finalScore + " pts";

  // Update submission status to "submitting"
  document.getElementById("submit-status-text").textContent = "Submitting to leaderboard…";
  document.querySelector(".status-dot").className = "status-dot";

  showScreen("screen-result");
}


// ════════════════════════════════════════════════════════════
//  SECTION 9 — GOOGLE SHEETS INTEGRATION
//  ──────────────────────────────────────────────────────────
//  HOW TO SET UP GOOGLE APPS SCRIPT:
//
//  1. Open Google Sheets and create a new sheet.
//     Add headers in row 1:
//     Timestamp | Team Name | Clue | Time Taken | Penalty | Final Score
//
//  2. Go to Extensions → Apps Script.
//
//  3. Replace everything with this code:
//
//     function doPost(e) {
//       var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//       var data  = JSON.parse(e.postData.contents);
//       sheet.appendRow([
//         new Date(),
//         data.teamName,
//         data.clueText,
//         data.timeTaken,
//         data.penalty,
//         data.finalScore
//       ]);
//       return ContentService
//         .createTextOutput(JSON.stringify({ status: "success" }))
//         .setMimeType(ContentService.MimeType.JSON);
//     }
//
//  4. Click Deploy → New deployment → Web app.
//     Set "Who has access" to "Anyone".
//     Click Deploy and copy the URL.
//
//  5. Paste the URL into SCRIPT_URL at the top of this file.
// ════════════════════════════════════════════════════════════

function sendToGoogleSheets(result) {
  // If the developer hasn't set a URL yet, show a warning and skip
  if (SCRIPT_URL === "PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE") {
    console.warn("Google Script URL not set. Skipping submission.");
    setSubmitStatus("warning", "⚠️ No leaderboard URL configured.");
    return;
  }

  // Build the data object to send
  const payload = {
    teamName:   result.teamName,
    clueText:   result.clueText,
    timeTaken:  result.timeTaken,
    penalty:    result.penalty,
    finalScore: result.finalScore
  };

  // fetch() sends an HTTP request to the Apps Script URL
  fetch(SCRIPT_URL, {
    method:  "POST",
    mode:    "no-cors",           // Required for Google Apps Script
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload)
  })
  .then(function () {
    // "no-cors" means we can't read the response body, but if we get
    // here without an error, the request was sent successfully.
    setSubmitStatus("done", "✅ Submission successful!");
  })
  .catch(function (err) {
    console.error("Submission failed:", err);
    setSubmitStatus("failed", "❌ Could not reach leaderboard.");
  });
}

// Updates the status pill at the bottom of the result card
function setSubmitStatus(state, message) {
  document.getElementById("submit-status-text").textContent = message;
  const dot = document.querySelector(".status-dot");
  dot.className = "status-dot " + state;   // adds class "done" or "failed"
}


// ════════════════════════════════════════════════════════════
//  SECTION 10 — ANIMATED STAR BACKGROUND (Canvas)
//  This is purely decorative — safe to delete if you want.
// ════════════════════════════════════════════════════════════

(function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  const ctx    = canvas.getContext("2d");
  let stars    = [];

  // Make canvas fill the full window
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Create 90 random star objects
  for (let i = 0; i < 90; i++) {
    stars.push({
      x:      Math.random() * window.innerWidth,
      y:      Math.random() * window.innerHeight,
      r:      Math.random() * 1.4 + 0.3,
      speed:  Math.random() * 0.3 + 0.05,
      alpha:  Math.random()
    });
  }

  // Draw stars every frame
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(function (star) {
      // Gently animate opacity for a twinkling effect
      star.alpha += star.speed * 0.02;
      if (star.alpha > 1) { star.alpha = 0; }   // reset when faded out

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(232, 160, 32, " + (star.alpha * 0.5) + ")";
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
})();

