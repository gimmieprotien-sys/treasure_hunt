
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvekiQyTgNrjgpgd_rOcXR0ABmmnkTMqSNXueAl8Wa0po1WubIfGmcFx4QSa_rC8wd/exec";



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


// ── Scoring ──────────────────────────────────────────────────
const BASE_SCORE    = 20;   // Points before penalty
const PENALTY_RATE  = 2;    // Points lost per interval
const PENALTY_EVERY = 5;    // Minutes per penalty interval


// ════════════════════════════════════════════════════════════
//  SECTION 2 — GAME STATE
// ════════════════════════════════════════════════════════════

let teamName       = "";
let selectedClue   = null;
let timerInterval  = null;
let elapsedSeconds = 0;


// ════════════════════════════════════════════════════════════
//  SECTION 3 — TIMER
// ════════════════════════════════════════════════════════════

function startTimer() {
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(function () {
    elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateTimerDisplay() {
  const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const ss = String(elapsedSeconds % 60).padStart(2, "0");
  document.getElementById("timer-display").textContent = mm + ":" + ss;
}

function formatElapsedTime(totalSeconds) {
  return Math.floor(totalSeconds / 60) + "m " + (totalSeconds % 60) + "s";
}


// ════════════════════════════════════════════════════════════
//  SECTION 4 — SCREEN HELPERS
// ════════════════════════════════════════════════════════════

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(function (el) {
    el.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}


// ════════════════════════════════════════════════════════════
//  SECTION 5 — START HUNT
// ════════════════════════════════════════════════════════════

function startHunt() {
  const input = document.getElementById("team-name").value.trim();

  if (!input) {
    document.getElementById("start-error").classList.remove("hidden");
    document.getElementById("team-name").focus();
    return;
  }

  document.getElementById("start-error").classList.add("hidden");
  teamName = input;

  // Pick a random clue
  const randomIndex = Math.floor(Math.random() * clues.length);
  selectedClue = clues[randomIndex];

  // Fill in hunt screen
  document.getElementById("display-team").textContent = teamName;
  document.getElementById("clue-text").textContent    = selectedClue.clue;

  // Reset passcode fields
  document.getElementById("passcode-input").value = "";
  document.getElementById("passcode-error").classList.add("hidden");
  document.getElementById("submit-btn").disabled      = false;
  document.getElementById("passcode-input").disabled  = false;

  showScreen("screen-hunt");
  startTimer();
}


// ════════════════════════════════════════════════════════════
//  SECTION 6 — SUBMIT PASSCODE
// ════════════════════════════════════════════════════════════

function submitPasscode() {
  const entered = document.getElementById("passcode-input").value.trim().toUpperCase();
  const correct = selectedClue.code.toUpperCase();

  if (entered === correct) {
    // ── Correct ──
    stopTimer();
    document.getElementById("submit-btn").disabled     = true;
    document.getElementById("passcode-input").disabled = true;

    const result = calculateScore(elapsedSeconds);
    showResultScreen(result);
    sendToGoogleSheets(result);

  } else {
    // ── Wrong ──
    document.getElementById("passcode-error").classList.remove("hidden");
    document.getElementById("passcode-input").value = "";
    document.getElementById("passcode-input").focus();

    // Shake the input for feedback
    const input = document.getElementById("passcode-input");
    input.style.animation = "none";
    requestAnimationFrame(function () {
      input.style.animation = "shake 0.4s ease";
    });

    setTimeout(function () {
      document.getElementById("passcode-error").classList.add("hidden");
    }, 3000);
  }
}

// Shake keyframe injected via JS (keeps CSS clean)
(function injectShake() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); border-color: rgba(248,113,113,0.8); }
      20%      { transform: translateX(-7px); }
      40%      { transform: translateX(7px); }
      60%      { transform: translateX(-5px); }
      80%      { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);
})();

// Enter key support
document.getElementById("passcode-input").addEventListener("keydown", function (e) {
  if (e.key === "Enter") submitPasscode();
});
document.getElementById("team-name").addEventListener("keydown", function (e) {
  if (e.key === "Enter") startHunt();
});


// ════════════════════════════════════════════════════════════
//  SECTION 7 — SCORING
// ════════════════════════════════════════════════════════════

function calculateScore(totalSeconds) {
  const minutes          = Math.floor(totalSeconds / 60);
  const penaltyIntervals = Math.floor(minutes / PENALTY_EVERY);
  const penalty          = penaltyIntervals * PENALTY_RATE;
  const finalScore       = Math.max(0, BASE_SCORE - penalty);

  return {
    teamName:     teamName,
    clueText:     selectedClue.clue,
    timeTaken:    formatElapsedTime(totalSeconds),
    totalSeconds: totalSeconds,
    minutes:      minutes,
    penalty:      penalty,
    finalScore:   finalScore
  };
}


// ════════════════════════════════════════════════════════════
//  SECTION 8 — SHOW RESULT SCREEN
// ════════════════════════════════════════════════════════════

function showResultScreen(result) {
  document.getElementById("result-team-name").textContent = "🚀 Team: " + result.teamName;
  document.getElementById("result-time").textContent      = result.timeTaken;
  document.getElementById("result-penalty").textContent   = result.penalty > 0
    ? "-" + result.penalty + " pts"
    : "None 🎉";
  document.getElementById("result-score").textContent     = result.finalScore + " pts";

  document.getElementById("submit-status-text").textContent = "Transmitting to base…";
  document.querySelector(".status-dot").className = "status-dot";

  showScreen("screen-result");
}


// ════════════════════════════════════════════════════════════
//  SECTION 9 — GOOGLE SHEETS INTEGRATION
//  ──────────────────────────────────────────────────────────
//  HOW TO SET UP:
//  1. Open Google Sheets → Extensions → Apps Script
//  2. Paste this function and save:
//
//     function doPost(e) {
//       var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//       var data  = JSON.parse(e.postData.contents);
//       sheet.appendRow([
//         new Date(), data.teamName, data.clueText,
//         data.timeTaken, data.penalty, data.finalScore
//       ]);
//       return ContentService
//         .createTextOutput(JSON.stringify({ status: "success" }))
//         .setMimeType(ContentService.MimeType.JSON);
//     }
//
//  3. Deploy → New deployment → Web app
//     Execute as: Me | Who has access: Anyone
//  4. Copy the /exec URL and paste it into SCRIPT_URL above.
// ════════════════════════════════════════════════════════════

function sendToGoogleSheets(result) {
  if (SCRIPT_URL === "PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE") {
    console.warn("Google Script URL not configured.");
    setSubmitStatus("warning", "⚠️ No leaderboard URL set.");
    return;
  }

  fetch(SCRIPT_URL, {
    method:  "POST",
    mode:    "no-cors",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      teamName:   result.teamName,
      clueText:   result.clueText,
      timeTaken:  result.timeTaken,
      penalty:    result.penalty,
      finalScore: result.finalScore
    })
  })
  .then(function ()      { setSubmitStatus("done",   "✅ Transmission successful!"); })
  .catch(function (err)  {
    console.error("Submission failed:", err);
    setSubmitStatus("failed", "❌ Transmission failed.");
  });
}

function setSubmitStatus(state, message) {
  document.getElementById("submit-status-text").textContent = message;
  document.querySelector(".status-dot").className = "status-dot " + state;
}


// ════════════════════════════════════════════════════════════
//  SECTION 10 — GALAXY BACKGROUND CANVAS
//  Draws: twinkling stars + nebula colour clouds + shooting stars
// ════════════════════════════════════════════════════════════

(function initGalaxy() {
  const canvas = document.getElementById("bg-canvas");
  const ctx    = canvas.getContext("2d");

  // ── Resize canvas to fill window ──
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // ── Generate twinkling stars ──
  // Each star has a position, size, and independent twinkle speed/phase
  const STAR_COUNT = 180;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      r:       Math.random() * 1.8 + 0.3,
      phase:   Math.random() * Math.PI * 2,   // offset so they don't all pulse together
      speed:   Math.random() * 0.04 + 0.01,
      // colour: mostly white, some tinted
      hue:     Math.random() < 0.3 ? (Math.random() < 0.5 ? 200 : 280) : 0,
      sat:     Math.random() < 0.3 ? 80 : 0
    });
  }

  // ── Shooting stars ──
  const shooters = [];
  function spawnShooter() {
    shooters.push({
      x:     Math.random() * canvas.width * 0.7,
      y:     Math.random() * canvas.height * 0.4,
      len:   Math.random() * 120 + 60,
      speed: Math.random() * 6 + 4,
      alpha: 1,
      angle: Math.PI / 5 + (Math.random() - 0.5) * 0.3   // roughly 36°
    });
  }
  // Spawn a shooting star every 2-5 seconds
  spawnShooter();
  setInterval(spawnShooter, Math.random() * 3000 + 2000);

  // ── Nebula cloud config ──
  // These are big soft radial gradients painted once per frame
  // at fixed positions — they give the galaxy its colour depth.
  const nebulae = [
    { x: 0.15, y: 0.25, r: 0.35, color: "rgba(124,58,237,0.06)"  },  // purple top-left
    { x: 0.80, y: 0.15, r: 0.30, color: "rgba(0,229,255,0.05)"   },  // cyan top-right
    { x: 0.50, y: 0.70, r: 0.45, color: "rgba(192,132,252,0.04)" },  // pink centre-bottom
    { x: 0.90, y: 0.65, r: 0.28, color: "rgba(34,211,238,0.045)" },  // teal right
    { x: 0.05, y: 0.80, r: 0.25, color: "rgba(244,114,182,0.05)" },  // pink left-bottom
  ];

  let frame = 0;

  // ── Main draw loop ──
  function draw() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Deep space gradient background
    const bg = ctx.createLinearGradient(0, 0, canvas.width * 0.5, canvas.height);
    bg.addColorStop(0,   "#050a1a");
    bg.addColorStop(0.4, "#08102a");
    bg.addColorStop(0.7, "#0d0820");
    bg.addColorStop(1,   "#050a1a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Nebula clouds (soft radial blobs of colour)
    nebulae.forEach(function (n) {
      const cx = n.x * canvas.width;
      const cy = n.y * canvas.height;
      const r  = n.r * Math.max(canvas.width, canvas.height);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0,   n.color);
      grad.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    // 3. Twinkling stars
    stars.forEach(function (s) {
      s.phase += s.speed;
      // alpha oscillates between 0.15 and 1 using a sine wave
      const alpha = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(s.phase));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);

      if (s.sat > 0) {
        ctx.fillStyle = "hsla(" + s.hue + "," + s.sat + "%,80%," + alpha + ")";
      } else {
        ctx.fillStyle = "rgba(255,255,255," + alpha + ")";
      }
      ctx.fill();

      // Bright stars get a soft glow ring
      if (s.r > 1.3 && alpha > 0.7) {
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        glow.addColorStop(0,   "rgba(200,220,255," + (alpha * 0.3) + ")");
        glow.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 4. Shooting stars
    for (let i = shooters.length - 1; i >= 0; i--) {
      const sh = shooters[i];

      // Move the shooter along its angle
      sh.x     += Math.cos(sh.angle) * sh.speed;
      sh.y     += Math.sin(sh.angle) * sh.speed;
      sh.alpha -= 0.012;

      if (sh.alpha <= 0) {
        shooters.splice(i, 1);   // remove faded shooter
        continue;
      }

      // Draw the glowing streak
      const tailX = sh.x - Math.cos(sh.angle) * sh.len;
      const tailY = sh.y - Math.sin(sh.angle) * sh.len;

      const grad = ctx.createLinearGradient(tailX, tailY, sh.x, sh.y);
      grad.addColorStop(0,   "rgba(255,255,255,0)");
      grad.addColorStop(0.6, "rgba(180,220,255," + (sh.alpha * 0.4) + ")");
      grad.addColorStop(1,   "rgba(255,255,255," + sh.alpha + ")");

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(sh.x, sh.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Bright head dot
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + sh.alpha + ")";
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

