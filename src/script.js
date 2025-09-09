// Elements
const upperClicked = document.getElementById('uppercase');
const lowerClicked = document.getElementById('lowercase');
const numberClicked  = document.getElementById('numbers');
const symbolClicked  = document.getElementById('symbols');

const bars = Array.from(document.querySelectorAll('.bar'));
const strengthLabel = document.getElementById('strengthLabel');

const lengthRange = document.getElementById('lengthRange');
const lengthVal = document.getElementById('lengthVal');
const passwordOutput = document.getElementById('passwordOutput');
const copyBtn = document.getElementById('copyBtn');
const copiedToast = document.getElementById('copiedToast');
const generateBtn = document.getElementById('generateBtn');

// Character pools
const UPPERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERS = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS   = "0123456789";
const SYMBOLS   = "!@#$%^&*()-_=+[]{};:,.<>?/";

// Crypto-safe random int [0, n)
const randInt = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;

// Fisher–Yates shuffle
function shuffle(str) {
    const arr = [...str];
    for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

function updateSliderFill() {
    const val = (lengthRange.value - lengthRange.min) / (lengthRange.max - lengthRange.min) * 100;
    lengthRange.style.background = `linear-gradient(to right, var(--accent) ${val}%, #2e3038 ${val}%)`;
}

// Build password respecting selected pools and length
function generatePassword() {
    const len = Number(lengthRange.value);

    const pools = [];
    if (upperClicked.checked) pools.push(UPPERS);
    if (lowerClicked.checked) pools.push(LOWERS);
    if (numberClicked.checked)  pools.push(NUMBERS);
    if (symbolClicked.checked)  pools.push(SYMBOLS);

    if (!pools.length) return "Select at least one option";

    // Ensure at least one from each selected pool
    let pwd = pools.map(pool => pool[randInt(pool.length)]).join('');

    // Fill remaining with union
    const union = pools.join('');
    for (let i = pwd.length; i < len; i++) {
    pwd += union[randInt(union.length)];
    }

    return shuffle(pwd);
}

// Strength scoring (length + diversity) => 0..4
function scoreStrength(pwd) {
    if (!pwd) return 0;

    const len = pwd.length;

    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNum   = /[0-9]/.test(pwd);
    const hasSym   = /[^A-Za-z0-9]/.test(pwd);

    // Symbol rules
    if (len < 5) return 1;                 // too short = Weak
    if (len < 8 && hasSym) return 3;       // 5–7 chars + symbol = Medium
    if (len >= 8 && hasSym) return 4;      // 8+ chars + symbol = Strong

    // General rules
    let diversity = 0;
    if (hasUpper) diversity++;
    if (hasLower) diversity++;
    if (hasNum)   diversity++;
    if (hasSym)   diversity++;

    if (len >= 15 && diversity >= 3) return 4; // Strong
    if (len >= 10 && diversity >= 2) return 3; // Medium
    if (len >= 6) return 2;                    // Weak-ish baseline

    return 1; // fallback Weak
}

function paintStrength(score) {
    bars.forEach(b => b.style.background = 'var(--bar-empty)');

    let color = 'var(--danger)';
    let label = 'WEAK';

    if (score === 3) {
        color = 'var(--warn)'; 
        label = 'MEDIUM'; 
    }

    if (score === 4) { 
        color = 'var(--accent)';
        label = 'STRONG';
    }

    strengthLabel.textContent = label;

    for (let i = 0; i < score; i++) {
        bars[i].style.background = color;
    }
}

// Slider fill
function paintRangeFill() {
    const min = Number(lengthRange.min);
    const max = Number(lengthRange.max);
    const val = Number(lengthRange.value);
    const pct = ((val - min) / (max - min)) * 100;
    lengthRange.style.background = `linear-gradient(90deg, var(--accent) ${pct}%, #2e3038 ${pct}%)`;
}

// Events - remove white placeholder thumb when user moves slider
lengthRange.addEventListener('input', () => {
    lengthVal.textContent = lengthRange.value;
    lengthRange.setAttribute('aria-valuenow', lengthRange.value);
    paintRangeFill();
    lengthRange.classList.remove("placeholder");
    updateSliderFill();
});

// On first load (icon green)
copyBtn.classList.add("icon-green");

// Copy to clipboard (with fallback)
copyBtn.addEventListener('click', async () => {
    const text = passwordOutput.textContent.trim();
    if (!text || text.startsWith('Select at')) return;

    try {
        await navigator.clipboard.writeText(text);
        copiedToast.classList.add('show');
        setTimeout(() => copiedToast.classList.remove('show'), 900);
    } catch (err) {
        console.error("Copy failed:", err);
    }
});

// Password generated then switch to white
function performGenerate() {
    if (!lengthRange) {
    console.warn("lengthRange element not found");
    alert("Internal error: length input missing.");
    return;
    }

    // Read & validate length safely
    const raw = String(lengthRange.value ?? "").trim();
    const length = Number.parseInt(raw, 10);

    console.log("Slider value read:", raw, "→ parsed:", length);

    if (!Number.isFinite(length) || length < 1) {
    alert("Password length must be greater than 0.");
    return;
    }

    if (!upperClicked.checked && !ckLower.checked && !numberClicked.checked && !symbolClicked.checked) {
    alert("Please select at least one option (Uppercase, Lowercase, Numbers, or Symbols).");
    return;
    }

    const pwd = generatePassword();
    if (!pwd) return;

    passwordOutput.textContent = pwd;
    passwordOutput.classList.remove("placeholder");
    lengthRange.classList.remove("placeholder");
    copyBtn.classList.remove("icon-green");

    const score = scoreStrength(pwd);
    paintStrength(score);
}

generateBtn.addEventListener('click', performGenerate);

// Call once on load
updateSliderFill();

// Initial render
paintRangeFill();





