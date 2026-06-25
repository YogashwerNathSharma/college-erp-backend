/**
 * yn AI - Smart ERP Assistant (ChatGPT-style) v3
 * 
 * LOGIC:
 * 1. Score all intents by keyword matching
 * 2. If command has extra words (likely a name/context) → favor search over navigation
 * 3. If no ERP intent matches → treat as general question (ChatGPT mode)
 * 4. Backend handles general AI questions via OpenAI/Gemini API
 */

import axios from "axios";

type ActionType = "navigate" | "fetch" | "print" | "show" | "generate";

type AiResponse = {
  message: string;
  action?: {
    type: ActionType;
    payload?: any;
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTENT DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Intent {
  id: string;
  type: "action" | "navigate"; // action = search/fetch/generate, navigate = just open page
  keywords: string[];
  antiKeywords?: string[];
  handler: (command: string, extracted: ExtractedData) => AiResponse;
}

interface ExtractedData {
  studentName?: string;
  className?: string;
  section?: string;
  fatherName?: string;
  rollNo?: string;
  subject?: string;
  hasExtraWords: boolean; // TRUE if command has words beyond keywords (likely a name)
  original: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTENTS — "action" type always beats "navigate" when extra words present
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const INTENTS: Intent[] = [

  // ═══════ ACTION: FEE RECEIPT / FEE SEARCH ═══════
  {
    id: "fee_receipt",
    type: "action",
    keywords: ["fee", "fees", "receipt", "reciept", "recipt", "raseed", "slip", "challan", "fee receipt", "fee reciept", "fee slip", "fee dikhao", "fee batao", "fee do", "fee nikalo", "fee ki", "ki fee", "ka fee", "fee lao", "payment receipt", "paid", "jama", "fee de", "fee dedo", "all fee", "sabhi fee", "fee list", "fee report", "receipts"],
    handler: (cmd, ext) => ({
      message: `💰 Fee receipt search kar raha hoon: **${ext.studentName || cmd}**\n\n⏳ Backend se data aa raha hai...`,
      action: { type: "fetch", payload: { endpoint: "/api/ai/fees/receipts/search", query: ext.original } },
    }),
  },

  // ═══════ ACTION: REPORT CARD ═══════
  {
    id: "report_card",
    type: "action",
    keywords: ["report card", "report", "marksheet", "marks", "result", "nateeja", "grade", "parnam patra", "report dikhao", "report do", "result dikhao", "marks dikhao", "report nikalo"],
    antiKeywords: ["attendance report", "fee report"],
    handler: (cmd, ext) => ({
      message: `📝 Report card fetch kar raha hoon: **${ext.studentName || ext.className || cmd}**\n\n⏳ Data load ho raha hai...`,
      action: { type: "fetch", payload: { endpoint: "/api/ai/exams/report-card/search", query: cmd } },
    }),
  },

  // ═══════ ACTION: ATTENDANCE CHECK ═══════
  {
    id: "attendance_check",
    type: "action",
    keywords: ["attendance", "haziri", "hajiri", "upasthiti", "present", "absent", "attendance dikhao", "attendance batao", "aaj ki attendance", "attendance show", "attendance do", "kitne present", "kitne absent"],
    handler: (cmd, ext) => ({
      message: `📋 Attendance fetch kar raha hoon: **${ext.className ? "Class " + ext.className : "Today"}**\n\n⏳ Data load ho raha hai...`,
      action: { type: "fetch", payload: { endpoint: "/api/ai/attendance/search", query: cmd } },
    }),
  },

  // ═══════ ACTION: STUDENT SEARCH ═══════
  {
    id: "student_search",
    type: "action",
    keywords: ["student", "vidyarthi", "chatra", "bachcha", "search", "find", "dhundo", "khojo", "details", "info", "kaun hai", "student dikhao", "student batao", "student do", "kon hai"],
    antiKeywords: ["fee", "receipt", "report card", "attendance", "admit card"],
    handler: (cmd, ext) => ({
      message: `🔍 Student search kar raha hoon: **${ext.studentName || cmd}**\n\n⏳ Database me dhundh raha hoon...`,
      action: { type: "fetch", payload: { endpoint: "/api/ai/students/search", query: cmd } },
    }),
  },

  // ═══════ ACTION: PAPER GENERATE ═══════
  {
    id: "generate_paper",
    type: "action",
    keywords: ["paper", "question paper", "paper banao", "paper bana", "paper generate", "paper create", "paper nikalo", "paper do", "paper chahiye", "prashn patra", "exam paper"],
    antiKeywords: ["news paper", "paper weight"],
    handler: (cmd, ext) => ({
      message: `📄 **Question Paper Generator**\n\nBatao:\n• Subject: ${ext.subject || "?"}\n• Class: ${ext.className || "?"}\n• Marks: 80/100?\n• Type: Unit Test / Half Yearly / Annual?\n\nExample: "math paper class 10 annual 80 marks" 🧠`,
      action: { type: "generate", payload: { generator: "question_paper", query: cmd } },
    }),
  },

  // ═══════ ACTION: LESSON PLAN ═══════
  {
    id: "lesson_plan",
    type: "action",
    keywords: ["lesson plan", "lesson", "paath yojana", "teaching plan", "lesson banao", "lesson bana", "lesson create", "period plan", "pathyojana"],
    handler: (cmd, ext) => ({
      message: `📋 **Lesson Plan Generator**\n\nBatao:\n• Subject: ${ext.subject || "?"}\n• Class: ${ext.className || "?"}\n• Topic/Chapter: ?\n• Duration: 1 week?\n\nExample: "science lesson plan class 8 topic photosynthesis" 📚`,
      action: { type: "generate", payload: { generator: "lesson_plan", query: cmd } },
    }),
  },

  // ═══════ ACTION: MASTER PLAN ═══════
  {
    id: "master_plan",
    type: "action",
    keywords: ["master plan", "annual plan", "yearly plan", "academic plan", "varshik yojana", "session plan", "academic calendar", "school plan"],
    handler: (cmd) => ({
      message: `📊 **Master Plan Generator**\n\nBatao:\n• Academic Year: 2025-26?\n• Classes: All / Specific?\n• Board: CBSE / State?\n\nMain complete annual plan banata hoon! 🗓️`,
      action: { type: "generate", payload: { generator: "master_plan", query: cmd } },
    }),
  },

  // ═══════ ACTION: SCHOOL STATS ═══════
  {
    id: "stats",
    type: "action",
    keywords: ["stats", "statistics", "total students", "total teachers", "kitne students", "kitne teachers", "how many", "count", "school stats", "data dikhao", "overview"],
    handler: (cmd) => ({
      message: `📊 School statistics fetch kar raha hoon...`,
      action: { type: "fetch", payload: { endpoint: "/api/ai/process-command", query: "stats " + cmd } },
    }),
  },

  // ═══════ ACTION: DEFAULTERS ═══════
  {
    id: "defaulters",
    type: "action",
    keywords: ["defaulter", "defaulters", "baki", "pending fee", "unpaid", "dues", "fee nahi di", "fee pending", "fee baki"],
    handler: (cmd) => ({
      message: `⚠️ Fee defaulters fetch kar raha hoon...`,
      action: { type: "fetch", payload: { endpoint: "/api/ai/process-command", query: "defaulters " + cmd } },
    }),
  },

  // ═══════ ACTION: ALL RECEIPTS / PRINT RECEIPT ═══════
  {
    id: "all_receipts",
    type: "action",
    keywords: ["all receipts", "saari receipts", "print receipt", "receipt print", "aaj tak ki receipt", "sabhi receipt", "poori receipt", "all fee receipts", "receipt list"],
    handler: () => ({
      message: `🧾 Saari receipts dikhata hoon... Dashboard par "Print Receipts" card pe click karein ya /fees/receipts page open karein.`,
      action: { type: "navigate", payload: { path: "/fees/receipts" } },
    }),
  },

  // ═══════ ACTION: TEACHER SEARCH ═══════
  {
    id: "teacher_search",
    type: "action",
    keywords: ["teacher", "adhyapak", "shikshak", "staff", "teacher search", "teacher dikhao", "teacher find"],
    handler: (cmd, ext) => ({
      message: `🔍 Teacher search kar raha hoon: **${ext.studentName || cmd}**`,
      action: { type: "fetch", payload: { endpoint: "/api/ai/process-command", query: cmd } },
    }),
  },

  // ═══════ NAVIGATE: DASHBOARD ═══════
  { id: "nav_dashboard", type: "navigate", keywords: ["dashboard", "home", "main page", "ghar", "mukhya page"],
    handler: () => ({ message: "✅ Dashboard open kar raha hoon...", action: { type: "navigate", payload: { path: "/dashboard" } } }) },

  // ═══════ NAVIGATE: STUDENTS ═══════
  { id: "nav_students", type: "navigate", keywords: ["students page", "student list", "all students", "sabhi students", "student page"],
    handler: () => ({ message: "✅ Students page open kar raha hoon...", action: { type: "navigate", payload: { path: "/students" } } }) },

  // ═══════ NAVIGATE: TEACHERS ═══════
  { id: "nav_teachers", type: "navigate", keywords: ["teachers page", "teacher list", "all teachers", "teacher page"],
    handler: () => ({ message: "✅ Teachers page open kar raha hoon...", action: { type: "navigate", payload: { path: "/teachers" } } }) },

  // ═══════ NAVIGATE: FEES ═══════
  { id: "nav_fees", type: "navigate", keywords: ["fee page", "fee collection", "fee module", "fees kholo", "fee page open", "fee dashboard", "open fees"],
    antiKeywords: ["receipt", "slip", "raseed", "dikhao", "batao", "do", "ki", "ka"],
    handler: () => ({ message: "✅ Fee Collection page open kar raha hoon...", action: { type: "navigate", payload: { path: "/fees/collection" } } }) },

  // ═══════ NAVIGATE: EXAMS ═══════
  { id: "nav_exams", type: "navigate", keywords: ["exam page", "exams page", "pareeksha", "exam kholo", "exam module", "open exams"],
    antiKeywords: ["paper", "marks", "result", "report", "admit"],
    handler: () => ({ message: "✅ Exams page open kar raha hoon...", action: { type: "navigate", payload: { path: "/exams" } } }) },

  // ═══════ NAVIGATE: ATTENDANCE ═══════
  { id: "nav_attendance", type: "navigate", keywords: ["attendance page", "attendance kholo", "open attendance", "attendance mark karo"],
    handler: () => ({ message: "✅ Attendance page open kar raha hoon...", action: { type: "navigate", payload: { path: "/attendance" } } }) },

  // ═══════ NAVIGATE: LIBRARY ═══════
  { id: "nav_library", type: "navigate", keywords: ["library", "pustakalaya", "library kholo", "library open"],
    handler: () => ({ message: "✅ Library open kar raha hoon...", action: { type: "navigate", payload: { path: "/library" } } }) },

  // ═══════ NAVIGATE: TRANSPORT ═══════
  { id: "nav_transport", type: "navigate", keywords: ["transport", "bus", "vehicle", "gaadi", "transport kholo"],
    handler: () => ({ message: "✅ Transport page open kar raha hoon...", action: { type: "navigate", payload: { path: "/transport" } } }) },

  // ═══════ NAVIGATE: TIMETABLE ═══════
  { id: "nav_timetable", type: "navigate", keywords: ["timetable", "time table", "schedule", "samay sarni", "timetable kholo"],
    handler: () => ({ message: "✅ Timetable page open kar raha hoon...", action: { type: "navigate", payload: { path: "/timetable" } } }) },

  // ═══════ NAVIGATE: REPORTS ═══════
  { id: "nav_reports", type: "navigate", keywords: ["reports page", "analytics page", "reports kholo", "open reports"],
    handler: () => ({ message: "✅ Reports page open kar raha hoon...", action: { type: "navigate", payload: { path: "/reports" } } }) },

  // ═══════ NAVIGATE: SETTINGS ═══════
  { id: "nav_settings", type: "navigate", keywords: ["settings", "setting", "configuration", "settings kholo"],
    handler: () => ({ message: "✅ Settings open kar raha hoon...", action: { type: "navigate", payload: { path: "/settings" } } }) },

  // ═══════ NAVIGATE: ADMISSION ═══════
  { id: "nav_admission", type: "navigate", keywords: ["admission", "new admission", "admission form", "dakhila", "admission kholo"],
    handler: () => ({ message: "✅ Admission form open kar raha hoon...", action: { type: "navigate", payload: { path: "/students/admission" } } }) },

  // ═══════ NAVIGATE: ID CARD ═══════
  { id: "nav_idcard", type: "navigate", keywords: ["id card", "identity card", "pehchan patra", "student id"],
    handler: () => ({ message: "✅ ID Card page open kar raha hoon...", action: { type: "navigate", payload: { path: "/students/id-card" } } }) },

  // ═══════ NAVIGATE: ADMIT CARD ═══════
  { id: "nav_admitcard", type: "navigate", keywords: ["admit card", "pravesh patra", "hall ticket"],
    handler: () => ({ message: "✅ Admit Card page open kar raha hoon...", action: { type: "navigate", payload: { path: "/exams/admit-card" } } }) },

  // ═══════ NAVIGATE: CERTIFICATE ═══════
  { id: "nav_certificate", type: "navigate", keywords: ["certificate", "praman patra", "tc", "transfer certificate", "character certificate", "bonafide"],
    handler: () => ({ message: "✅ Certificate page open kar raha hoon...", action: { type: "navigate", payload: { path: "/reports/certificate" } } }) },

  // ═══════ NAVIGATE: MARKS ENTRY ═══════
  { id: "nav_marks", type: "navigate", keywords: ["marks entry", "marks dalo", "marks enter", "marks fill", "marks bharein"],
    handler: () => ({ message: "✅ Marks Entry open kar raha hoon...", action: { type: "navigate", payload: { path: "/exams/marks-entry" } } }) },

  // ═══════ NAVIGATE: PROMOTION ═══════
  { id: "nav_promotion", type: "navigate", keywords: ["promotion", "promote", "unnati", "promotion page"],
    handler: () => ({ message: "✅ Promotion page open kar raha hoon...", action: { type: "navigate", payload: { path: "/students/promotion" } } }) },

  // ═══════ NAVIGATE: BACKUP ═══════
  { id: "nav_backup", type: "navigate", keywords: ["backup", "data backup", "restore", "backup karo"],
    handler: () => ({ message: "✅ Backup page open kar raha hoon...", action: { type: "navigate", payload: { path: "/backup" } } }) },

  // ═══════ HELP ═══════
  {
    id: "help",
    type: "action",
    keywords: ["help", "madad", "kya kar sakte", "commands", "what can you do", "sahayata", "kaise kare"],
    handler: () => ({
      message: `🤖 **yn AI — Main ye sab kar sakta hoon:**

💬 **General Questions (ChatGPT jaisa):**
"What is gravity?", "essay on independence day", "5+3 kitna hai"

💰 **Fee:** "Rahul ki fee receipt do", "class 10 ki pending fee"
📝 **Report Card:** "Ujjwal ka report card dikhao"
📋 **Attendance:** "aaj ki attendance", "class 5 ki attendance"
🔍 **Search:** "student Rahul dhundo", "father name Rajesh"
📄 **Generate:** "math paper banao", "lesson plan science", "master plan"
📊 **Stats:** "total students", "school stats"

📍 **Pages open karo:**
"dashboard kholo", "fees kholo", "attendance page", "exams", "library", "transport", "timetable", "reports", "settings", "admission", "backup"

Kuch bhi poocho — Hindi, English, Hinglish! 💪`,
    }),
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SMART SCORING ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Check if a word is "close enough" to a keyword (handles typos)
function isFuzzyMatch(word: string, keyword: string): boolean {
  if (word.length < 3 || keyword.length < 3) return word === keyword;
  // Allow 1 typo for short words, 2 for longer
  const maxDist = keyword.length <= 5 ? 1 : 2;
  return levenshtein(word, keyword) <= maxDist;
}

function scoreIntent(command: string, intent: Intent, hasExtraWords: boolean): number {
  const lower = command.toLowerCase();
  const commandWords = lower.split(/\s+/);
  let score = 0;

  // Check each keyword
  for (const keyword of intent.keywords) {
    const kw = keyword.toLowerCase();

    // Direct substring match (best)
    if (lower.includes(kw)) {
      const kwWords = kw.split(/\s+/).length;
      score += kwWords >= 2 ? 3 : 1;
    } else {
      // Fuzzy match — check each word in command against keyword
      for (const word of commandWords) {
        if (word.length >= 3 && isFuzzyMatch(word, kw)) {
          score += 0.8; // Fuzzy match gives slightly less score
          break;
        }
      }
    }
  }

  // Anti-keywords reduce score heavily
  if (intent.antiKeywords) {
    for (const anti of intent.antiKeywords) {
      if (lower.includes(anti.toLowerCase())) {
        score -= 3;
      }
    }
  }

  // KEY RULE: If command has extra words (likely a person's name or context)
  // AND this is just a "navigate" intent → heavily penalize it
  // Because "ujjwal das ki fee receipt" should SEARCH, not just open fee page
  if (hasExtraWords && intent.type === "navigate") {
    score -= 2;
  }

  // Bonus: If "action" type and has extra words → boost it
  if (hasExtraWords && intent.type === "action") {
    score += 1;
  }

  return Math.max(0, score);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATA EXTRACTOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// All known "noise" words that are NOT a person's name
const NOISE_WORDS = new Set([
  "show", "get", "find", "print", "search", "dikhao", "kholo", "batao", "nikalo",
  "lao", "do", "karo", "open", "fee", "fees", "receipt", "report", "card", "attendance",
  "student", "class", "section", "roll", "marks", "result", "paper", "lesson", "plan",
  "master", "generate", "banao", "bana", "create", "of", "for", "ka", "ki", "ke", "se",
  "me", "the", "a", "an", "is", "hai", "hain", "wise", "name", "all", "page", "module",
  "dashboard", "settings", "library", "transport", "timetable", "exam", "exams", "backup",
  "admission", "promote", "promotion", "certificate", "id", "card", "admit", "teacher",
  "teachers", "students", "total", "stats", "help", "madad", "meri", "mera", "uska",
  "uski", "unki", "unka", "sabhi", "sab", "aaj", "today", "yesterday", "kal",
  "monthly", "yearly", "annual", "daily", "week", "subject", "topic", "chapter",
  "math", "science", "english", "hindi", "social", "physics", "chemistry", "biology",
  "history", "geography", "economics", "computer", "sanskrit", "question", "test",
  "unit", "half", "yearly", "marks", "pending", "due", "paid", "unpaid", "baki",
  "collection", "head", "structure", "entry", "dalo", "fill", "enter",
  "khojo", "dhundo", "poocho", "pucho", "bolo", "btao", "de", "dedo",
  "list", "sir", "mam", "please", "plz", "pls", "ji", "haan", "ok",
  "reciept", "recipt", "recept", "recepit", "daski",
]);

function extractData(command: string): ExtractedData {
  const lower = command.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 0);
  const data: ExtractedData = { original: command, hasExtraWords: false };

  // Extract class
  const classMatch = lower.match(/class\s*[-]?\s*(\d+)/i) ||
    lower.match(/(\d+)\s*(?:th|st|nd|rd|vi)/i);
  if (classMatch) data.className = classMatch[1];

  // Extract section
  const secMatch = lower.match(/(?:section|sec)\s*[-]?\s*([a-z])/i) ||
    lower.match(/\b\d+\s*[-]\s*([a-z])\b/i);
  if (secMatch) data.section = secMatch[1].toUpperCase();

  // Extract subject
  const subjects = ["math", "mathematics", "science", "english", "hindi", "social", "sst", "physics", "chemistry", "biology", "history", "geography", "economics", "computer", "sanskrit"];
  for (const sub of subjects) {
    if (lower.includes(sub)) { data.subject = sub.charAt(0).toUpperCase() + sub.slice(1); break; }
  }

  // Extract father name
  const fatherMatch = lower.match(/(?:father|papa|pita|pitaji)(?:'s)?\s*(?:name|naam)?\s*(?:is|hai|=|:)?\s*(\w+)/i);
  if (fatherMatch) data.fatherName = fatherMatch[1];

  // Extract roll number
  const rollMatch = lower.match(/roll\s*(?:no|number|num|#)?\s*\.?\s*(\d+)/i);
  if (rollMatch) data.rollNo = rollMatch[1];

  // Detect "extra words" = words that are NOT common keywords
  // These are likely person names!
  const extraWords: string[] = [];
  for (const word of words) {
    // Skip if it's a number, or very short, or a known noise word
    if (word.length <= 1) continue;
    if (/^\d+$/.test(word)) continue;
    if (NOISE_WORDS.has(word)) continue;
    extraWords.push(word);
  }

  if (extraWords.length > 0) {
    data.hasExtraWords = true;
    data.studentName = extraWords.join(" ");
  }

  return data;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PROCESSOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Pre-process: Split joined Hindi words & fix common patterns
 * "daski" → "das ki", "kafee" → "ka fee", "kireceipt" → "ki receipt"
 */
function preProcess(input: string): string {
  let text = input;

  // Split joined postpositions: "daski" → "das ki", "kareceipt" → "ka receipt"
  const postpositions = ["ki", "ka", "ke", "ko", "se", "me", "ne", "pe"];
  for (const pp of postpositions) {
    // Pattern: [word][postposition] where word is 2+ chars
    const regex = new RegExp(`(\\w{2,})(${pp})\\b`, "gi");
    text = text.replace(regex, (match, word, post) => {
      // Only split if the combined word isn't a known keyword
      if (NOISE_WORDS.has(match.toLowerCase())) return match;
      return `${word} ${post}`;
    });
  }

  // Fix common typos
  text = text.replace(/\breciept\b/gi, "receipt");
  text = text.replace(/\brecepit\b/gi, "receipt");
  text = text.replace(/\brecipt\b/gi, "receipt");
  text = text.replace(/\breceitp\b/gi, "receipt");
  text = text.replace(/\battendence\b/gi, "attendance");

  return text;
}

export async function processCommand(command: string): Promise<AiResponse> {
  const trimmed = command.trim();
  if (!trimmed) return { message: "🤖 Kuch toh boliye ya likhiye!" };

  // Pre-process: split common joined Hindi postpositions
  const normalized = preProcess(trimmed);

  // Extract data
  const extracted = extractData(normalized);

  // Score all intents
  const scores: { intent: Intent; score: number }[] = [];
  for (const intent of INTENTS) {
    const score = scoreIntent(normalized, intent, extracted.hasExtraWords);
    if (score > 0) {
      scores.push({ intent, score });
    }
  }

  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);

  // If best match found with decent score
  if (scores.length > 0 && scores[0].score >= 2) {
    const best = scores[0];
    const response = best.intent.handler(trimmed, extracted);

    // If action needs backend, fetch it
    if (response.action?.type === "fetch" && response.action.payload?.endpoint) {
      try {
        const apiResponse = await fetchFromBackend(
          response.action.payload.endpoint,
          response.action.payload.query || trimmed
        );
        return {
          message: apiResponse.message || response.message,
          action: apiResponse.action || response.action,
        };
      } catch {
        return { message: response.message + "\n\n⚠️ Server se response nahi aaya." };
      }
    }

    return response;
  }

  // ━━━ NO ERP MATCH → CHATGPT MODE (General Question) ━━━
  // Send to backend which will use AI API to answer anything
  try {
    const backendResponse = await sendToAiBackend(trimmed);
    return backendResponse;
  } catch {
    // Even if backend fails, try to give a smart response locally
    return generateLocalResponse(trimmed);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOCAL FALLBACK (when backend is down)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateLocalResponse(command: string): AiResponse {
  const lower = command.toLowerCase();

  // Basic math
  const mathMatch = command.match(/(\d+)\s*([+\-*/x×÷])\s*(\d+)/);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]);
    const op = mathMatch[2];
    const b = parseFloat(mathMatch[3]);
    let result = 0;
    switch (op) {
      case "+": result = a + b; break;
      case "-": result = a - b; break;
      case "*": case "x": case "×": result = a * b; break;
      case "/": case "÷": result = b !== 0 ? a / b : 0; break;
    }
    return { message: `🧮 **${a} ${op} ${b} = ${result}**` };
  }

  // Greetings
  if (/^(hi|hello|hey|namaste|namaskar|good morning|good evening)\b/i.test(lower)) {
    return { message: "🤖 Namaste! Main yn AI hoon. Kuch bhi poocho — ERP related ya general question. Sab answer dunga! 💪" };
  }

  // Thank you
  if (/^(thanks|thank you|dhanyavaad|shukriya|thankyou)\b/i.test(lower)) {
    return { message: "🤖 Aapka swagat hai! Aur kuch madad chahiye toh poocho. 😊" };
  }

  // Time/Date
  if (/(?:time|samay|waqt|kitne baje|kya time)/i.test(lower)) {
    const now = new Date();
    return { message: `🕐 Abhi time hai: **${now.toLocaleTimeString("en-IN")}** (${now.toLocaleDateString("en-IN")})` };
  }

  // Who are you
  if (/(?:kaun ho|who are you|tum kaun|kon ho|kya ho tum|apna naam)/i.test(lower)) {
    return { message: "🤖 Main **yn AI** hoon — aapka smart school assistant! Fee receipts, report cards, attendance, paper generation, lesson plans — sab kuch handle karta hoon. Kuch bhi poocho!" };
  }

  // Default — helpful fallback
  return {
    message: `🤖 Aapne poocha: "${command}"

Main abhi is sawal ka jawaab server se laane ki koshish karta hoon. Agar server connected nahi hai toh:

💡 **ERP Commands try karo:**
• "Rahul ki fee receipt do"
• "class 10 ka report card"
• "aaj ki attendance"
• "math paper banao"
• "dashboard kholo"
• "help" — poori list ke liye

🌐 General questions ke liye server (AI API) connected hona chahiye.`,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BACKEND API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function fetchFromBackend(endpoint: string, query: string): Promise<AiResponse> {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    endpoint,
    { query, command: query },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

async function sendToAiBackend(command: string): Promise<AiResponse> {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    "/api/ai/process-command",
    { command },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}
