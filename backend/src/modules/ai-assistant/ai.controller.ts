import { Request, Response } from "express";
import dotenv from "dotenv"; dotenv.config();
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

/**
 * yn AI — Backend Command Processor
 * 
 * FLOW:
 * 1. Try to understand as ERP command (fee, attendance, report card, etc.)
 * 2. If ERP command → query database
 * 3. If general question → use Gemini AI to answer (ChatGPT-style)
 * 4. Always give a helpful response — NEVER say "samajh nahi aaya"
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GEMINI AI INTEGRATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function askGemini(question: string, context?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `🤖 "${question}"\n\n⚠️ GEMINI_API_KEY not found in .env. Please restart server after adding it.`;
  }

  try {
    const systemPrompt = `You are yn AI, a smart school ERP assistant for Indian schools. 
You speak fluent Hindi + English (Hinglish). Always be helpful and friendly.
${context ? `\nERP Context: ${context}` : ""}
Answer in a mix of Hindi and English (Hinglish). Keep answers concise but complete.
Use emojis sparingly. Format nicely with bullet points where needed.`;

    const response = await axios.post(GEMINI_URL, {
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\nUser: " + question }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }, {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      timeout: 15000,
    });

    const data = response.data;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "🤖 Kuch response nahi mila AI se.";
  } catch (error: any) {
    console.error("Gemini error:", error?.response?.data || error.message);
    return `🤖 AI se connect nahi ho paya: ${error?.response?.data?.error?.message || error.message}`;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMMAND PROCESSOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function processAiCommand(req: Request, res: Response) {
  try {
    const { command } = req.body;
    const tenantId = (req as any).user?.tenantId;
    
    console.log("[yn AI] Command received:", command, "| Tenant:", tenantId, "| Gemini key exists:", !!GEMINI_API_KEY);

    if (!command) {
      return res.status(400).json({ message: "Command is required" });
    }

    // Step 1: Try to parse as ERP intent
    const intent = parseIntent(command);

    // Step 2: Handle ERP intents
    switch (intent.type) {
      case "fee_receipt":
        return await handleFeeReceiptQuery(intent, tenantId, res);
      case "report_card":
        return await handleReportCardQuery(intent, tenantId, res);
      case "attendance":
        return await handleAttendanceQuery(intent, tenantId, res);
      case "student_search":
        return await handleStudentSearch(intent, tenantId, res);
      case "stats":
        return await handleStatsQuery(tenantId, res);
      default:
        // Step 3: NOT an ERP command → Use Gemini AI (ChatGPT mode)
        const aiAnswer = await askGemini(command, `School: tenant ${tenantId}`);
        return res.json({ message: aiAnswer });
    }
  } catch (error: any) {
    console.error("AI Command Error:", error);
    return res.status(500).json({
      message: "❌ Server error. Please try again.",
    });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEARCH ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function searchFeeReceipts(req: Request, res: Response) {
  try {
    const { query } = req.body;
    const tenantId = (req as any).user?.tenantId;
    const intent = parseIntent(query || "");
    return await handleFeeReceiptQuery(intent, tenantId, res);
  } catch (error) {
    return res.status(500).json({ message: "Error searching fee receipts" });
  }
}

export async function searchReportCard(req: Request, res: Response) {
  try {
    const { query } = req.body;
    const tenantId = (req as any).user?.tenantId;
    const intent = parseIntent(query || "");
    return await handleReportCardQuery(intent, tenantId, res);
  } catch (error) {
    return res.status(500).json({ message: "Error searching report cards" });
  }
}

export async function searchAttendance(req: Request, res: Response) {
  try {
    const { query } = req.body;
    const tenantId = (req as any).user?.tenantId;
    const intent = parseIntent(query || "");
    return await handleAttendanceQuery(intent, tenantId, res);
  } catch (error) {
    return res.status(500).json({ message: "Error searching attendance" });
  }
}

export async function searchStudents(req: Request, res: Response) {
  try {
    const { query } = req.body;
    const tenantId = (req as any).user?.tenantId;
    const intent = parseIntent(query || "");
    return await handleStudentSearch(intent, tenantId, res);
  } catch (error) {
    return res.status(500).json({ message: "Error searching students" });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTENT PARSER (Flexible — handles Hinglish & typos)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ParsedIntent {
  type: "fee_receipt" | "report_card" | "attendance" | "student_search" | "stats" | "general";
  studentName?: string;
  className?: string;
  section?: string;
  fatherName?: string;
  rollNo?: string;
  raw: string;
}

function parseIntent(command: string): ParsedIntent {
  // Pre-process: fix typos & split joined words
  let lower = command.toLowerCase();
  lower = lower.replace(/\breciept\b/g, "receipt").replace(/\brecepit\b/g, "receipt");
  lower = lower.replace(/daski\b/g, "das ki").replace(/kaski\b/g, "kas ki");

  const intent: ParsedIntent = { type: "general", raw: command };

  // Extract class
  const classMatch = lower.match(/class\s*[-]?\s*(\d+)/i) || lower.match(/(\d+)\s*(?:th|st|nd|rd)/i);
  if (classMatch) intent.className = classMatch[1];

  // Extract section
  const secMatch = lower.match(/(?:section|sec)\s*[-]?\s*([a-z])/i);
  if (secMatch) intent.section = secMatch[1].toUpperCase();

  // Extract father name
  const fatherMatch = lower.match(/(?:father|papa|pita)(?:'s)?\s*(?:name)?\s*(?:is|hai)?\s*(\w+)/i);
  if (fatherMatch) intent.fatherName = fatherMatch[1];

  // Extract roll
  const rollMatch = lower.match(/roll\s*(?:no|number)?\s*\.?\s*(\d+)/i);
  if (rollMatch) intent.rollNo = rollMatch[1];

  // Determine type using keyword presence
  const feeWords = ["fee", "fees", "receipt", "raseed", "slip", "challan", "payment", "paid", "jama", "paisa"];
  const reportWords = ["report card", "report", "marksheet", "result", "marks", "nateeja"];
  const attendanceWords = ["attendance", "haziri", "hajiri", "present", "absent", "upasthiti"];
  const studentWords = ["student", "vidyarthi", "search", "find", "dhundo", "khojo"];
  const statsWords = ["stats", "total", "count", "kitne", "how many", "statistics"];

  const hasFee = feeWords.some(w => lower.includes(w));
  const hasReport = reportWords.some(w => lower.includes(w));
  const hasAttendance = attendanceWords.some(w => lower.includes(w));
  const hasStudent = studentWords.some(w => lower.includes(w));
  const hasStats = statsWords.some(w => lower.includes(w));

  if (hasFee) intent.type = "fee_receipt";
  else if (hasReport) intent.type = "report_card";
  else if (hasAttendance) intent.type = "attendance";
  else if (hasStudent) intent.type = "student_search";
  else if (hasStats) intent.type = "stats";
  else intent.type = "general"; // → Goes to Gemini AI

  // Extract student name — remove all known keywords
  const cleanName = command
    .replace(/(?:show|get|find|print|search|dikhao|kholo|batao|nikalo|lao|do|karo|open|fee|fees|receipt|reciept|report|card|attendance|student|class\s*\d+|section\s*[a-z]|roll\s*(?:no)?\s*\d+|father(?:'s)?\s*(?:name)?\s*\w*|\d+(?:th|st|nd|rd)?|marks|result|all|ab|tak|ki|ka|ke|se|me|of|for|the|wise|page|module|kholo|dikhao|batao)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanName.length >= 2 && cleanName.length <= 40) {
    intent.studentName = cleanName;
  }

  return intent;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ERP QUERY HANDLERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleFeeReceiptQuery(intent: ParsedIntent, tenantId: string, res: Response) {
  try {
    const where: any = { tenantId };

    // Build filters through StudentFee → Enrollment → Student
    const enrollmentWhere: any = {};
    const studentWhere: any = {};

    if (intent.studentName) {
      studentWhere.OR = [
        { firstName: { contains: intent.studentName, mode: "insensitive" } },
        { lastName: { contains: intent.studentName, mode: "insensitive" } },
        { fatherName: { contains: intent.studentName, mode: "insensitive" } },
      ];
    }
    if (intent.className) {
      enrollmentWhere.class = { name: { contains: intent.className, mode: "insensitive" } };
    }
    if (intent.section) {
      enrollmentWhere.section = { name: { contains: intent.section, mode: "insensitive" } };
    }
    if (intent.fatherName) {
      studentWhere.fatherName = { contains: intent.fatherName, mode: "insensitive" };
    }

    if (Object.keys(studentWhere).length > 0 || Object.keys(enrollmentWhere).length > 0) {
      where.studentFee = {
        enrollment: {
          ...enrollmentWhere,
          ...(Object.keys(studentWhere).length > 0 ? { student: studentWhere } : {}),
        },
      };
    }

    const receipts = await prisma.payment.findMany({
      where,
      include: {
        studentFee: {
          include: {
            enrollment: {
              include: {
                student: true,
                class: true,
                section: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (receipts.length === 0) {
      // No receipts found — use AI to give helpful response
      const aiHelp = await askGemini(
        `User asked for fee receipt: "${intent.raw}". No records found in database. Give a helpful response in Hinglish telling them to check the student name or that no payment exists yet. Keep it short.`
      );
      return res.json({ message: aiHelp || `❌ "${intent.studentName || "this student"}" ki koi fee receipt nahi mili.\n\n💡 Check karein:\n• Student ka naam sahi hai?\n• Payment hua hai?\n• Spelling check karein` });
    }

    const formatted = receipts.map((r) => ({
      receiptNo: r.receiptNo || r.id.slice(-6),
      studentName: `${r.studentFee?.enrollment?.student?.firstName || ""} ${r.studentFee?.enrollment?.student?.lastName || ""}`.trim(),
      class: r.studentFee?.enrollment?.class?.name || "",
      section: r.studentFee?.enrollment?.section?.name || "",
      amount: r.amount,
      date: r.paymentDate?.toLocaleDateString("en-IN"),
      method: r.method,
    }));

    return res.json({
      receipts: formatted,
      message: `💰 **${formatted.length} Fee Receipt(s) mili:**\n\n${formatted.map((r, i) => `${i + 1}. **${r.studentName}** — Class ${r.class}-${r.section}\n   Receipt: #${r.receiptNo} | ₹${r.amount} | ${r.date} | ${r.method}`).join("\n\n")}`,
      action: { type: "navigate", payload: { path: "/fees/receipts" } },
    });
  } catch (error: any) {
    console.error("Fee receipt error:", error);
    return res.json({ message: "❌ Fee receipt search me error. Database connection check karein.", receipts: [] });
  }
}

async function handleReportCardQuery(intent: ParsedIntent, tenantId: string, res: Response) {
  try {
    const enrollmentWhere: any = { tenantId, status: "active" };

    if (intent.className) {
      enrollmentWhere.class = { name: { contains: intent.className, mode: "insensitive" } };
    }
    if (intent.section) {
      enrollmentWhere.section = { name: { contains: intent.section, mode: "insensitive" } };
    }
    if (intent.studentName) {
      enrollmentWhere.student = {
        OR: [
          { firstName: { contains: intent.studentName, mode: "insensitive" } },
          { lastName: { contains: intent.studentName, mode: "insensitive" } },
        ],
      };
    }

    const enrollments = await prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: { student: true, class: true, section: true },
      take: 10,
    });

    if (enrollments.length === 0) {
      return res.json({ message: `❌ "${intent.studentName || intent.className || "specified"}" ke liye koi student nahi mila.\n\n💡 Check: naam, class, ya section sahi hai?` });
    }

    const formatted = enrollments.map((e) => ({
      id: e.studentId,
      name: `${e.student?.firstName || ""} ${e.student?.lastName || ""}`.trim(),
      class: e.class?.name || "",
      section: e.section?.name || "",
      rollNo: e.rollNumber || "",
    }));

    return res.json({
      students: formatted,
      message: `📝 **${formatted.length} Student(s) ke Report Card:**\n\n${formatted.map((s, i) => `${i + 1}. **${s.name}** — Class ${s.class}-${s.section} (Roll: ${s.rollNo})`).join("\n")}`,
      action: { type: "navigate", payload: { path: "/exams/report-card" } },
    });
  } catch (error: any) {
    console.error("Report card error:", error);
    return res.json({ message: "❌ Report card search me error.", students: [] });
  }
}

async function handleAttendanceQuery(intent: ParsedIntent, tenantId: string, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = { tenantId, date: { gte: today, lt: tomorrow }, isDeleted: false };

    if (intent.className) {
      const classRecord = await prisma.class.findFirst({
        where: { tenantId, name: { contains: intent.className, mode: "insensitive" } },
      });
      if (classRecord) where.classId = classRecord.id;
    }
    if (intent.section) {
      const sectionRecord = await prisma.section.findFirst({
        where: { tenantId, name: { contains: intent.section, mode: "insensitive" } },
      });
      if (sectionRecord) where.sectionId = sectionRecord.id;
    }

    const records = await prisma.attendance.findMany({ where });

    const total = records.length;
    const present = records.filter((a) => a.status === "PRESENT").length;
    const absent = records.filter((a) => a.status === "ABSENT").length;

    if (total === 0) {
      return res.json({ message: `📋 Aaj ki attendance abhi tak mark nahi hui ya koi record nahi mila.\n\n💡 Attendance page pe jaake mark kar sakte hain.` });
    }

    return res.json({
      message: `📋 **Aaj ki Attendance (${today.toLocaleDateString("en-IN")}):**\n\n👥 Total: ${total}\n✅ Present: ${present} (${Math.round((present / total) * 100)}%)\n❌ Absent: ${absent}`,
    });
  } catch (error: any) {
    console.error("Attendance error:", error);
    return res.json({ message: "❌ Attendance fetch me error." });
  }
}

async function handleStudentSearch(intent: ParsedIntent, tenantId: string, res: Response) {
  try {
    const enrollmentWhere: any = { tenantId, status: "active" };
    const studentWhere: any = {};

    if (intent.studentName) {
      studentWhere.OR = [
        { firstName: { contains: intent.studentName, mode: "insensitive" } },
        { lastName: { contains: intent.studentName, mode: "insensitive" } },
        { fatherName: { contains: intent.studentName, mode: "insensitive" } },
      ];
    }
    if (intent.className) {
      enrollmentWhere.class = { name: { contains: intent.className, mode: "insensitive" } };
    }
    if (intent.fatherName) {
      studentWhere.fatherName = { contains: intent.fatherName, mode: "insensitive" };
    }
    if (intent.rollNo) {
      enrollmentWhere.rollNumber = intent.rollNo;
    }
    if (Object.keys(studentWhere).length > 0) {
      enrollmentWhere.student = studentWhere;
    }

    const enrollments = await prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: { student: true, class: true, section: true },
      take: 10,
    });

    if (enrollments.length === 0) {
      return res.json({ message: `🔍 "${intent.studentName || "specified"}" naam ka koi student nahi mila.\n\n💡 Full name ya class ke saath try karein.` });
    }

    const formatted = enrollments.map((e) => ({
      name: `${e.student?.firstName || ""} ${e.student?.lastName || ""}`.trim(),
      class: e.class?.name || "",
      section: e.section?.name || "",
      rollNo: e.rollNumber || "",
      father: e.student?.fatherName || "",
      phone: e.student?.phone || "",
    }));

    return res.json({
      students: formatted,
      message: `🔍 **${formatted.length} Student(s) Found:**\n\n${formatted.map((s, i) => `${i + 1}. **${s.name}** — Class ${s.class}-${s.section}\n   Roll: ${s.rollNo} | Father: ${s.father} | Ph: ${s.phone}`).join("\n\n")}`,
    });
  } catch (error: any) {
    console.error("Student search error:", error);
    return res.json({ message: "❌ Student search me error." });
  }
}

async function handleStatsQuery(tenantId: string, res: Response) {
  try {
    const [students, teachers, classes] = await Promise.all([
      prisma.student.count({ where: { tenantId, isDeleted: false } }),
      prisma.teacher.count({ where: { tenantId, isDeleted: false } }),
      prisma.class.count({ where: { tenantId } }),
    ]);

    return res.json({
      message: `📊 **School Statistics:**\n\n👨‍🎓 Students: ${students}\n👨‍🏫 Teachers: ${teachers}\n🏫 Classes: ${classes}`,
    });
  } catch (error) {
    return res.json({ message: "❌ Stats fetch me error." });
  }
}
