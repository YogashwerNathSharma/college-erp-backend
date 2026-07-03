import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════
// PROCESS COMMAND — Main AI command handler
// Called by frontend yn AI service for general queries
// ══════════════════════════════════════════════════════

export const processAiCommand = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { command, query } = req.body;
    const text = (command || query || "").toLowerCase();

    // ─── STATS ───
    if (text.includes("stats") || text.includes("total students") || text.includes("total teachers") || text.includes("kitne")) {
      const studentCount = await prisma.student.count({ where: { tenantId, isDeleted: false } });
      const teacherCount = await prisma.teacher.count({ where: { tenantId, isActive: true } });

      const pendingFees = await prisma.studentFee.aggregate({
        where: { tenantId, status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE", "PENDING"] } },
        _sum: { balanceAmount: true },
      });

      return res.json({
        message: `📊 **School Statistics:**\n\n👨‍🎓 Total Students: **${studentCount}**\n👨‍🏫 Total Teachers: **${teacherCount}**\n💰 Pending Fees: **₹${(pendingFees._sum?.balanceAmount || 0).toLocaleString("en-IN")}**`,
      });
    }

    // ─── DEFAULTERS ───
    if (text.includes("defaulter") || text.includes("pending fee") || text.includes("baki")) {
      const defaulters = await prisma.studentFee.findMany({
        where: {
          tenantId,
          status: { in: ["UNPAID", "OVERDUE", "PENDING"] },
          balanceAmount: { gt: 0 },
        },
        include: {
          enrollment: { include: { student: true, class: true } },
        },
        orderBy: { balanceAmount: "desc" },
        take: 10,
      });

      if (defaulters.length === 0) {
        return res.json({ message: "✅ Koi defaulter nahi hai! Sab fees paid hain." });
      }

      let msg = `⚠️ **Top Fee Defaulters:**\n\n`;
      for (const d of defaulters) {
        const student = d.enrollment?.student;
        const className = (d.enrollment?.class as any)?.name || "";
        if (student) {
          msg += `• ${student.firstName} ${student.lastName} (${className}) — ₹${(d.balanceAmount || 0).toLocaleString("en-IN")}\n`;
        }
      }

      return res.json({ message: msg });
    }

    // ─── GENERAL AI (Gemini) ───
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (GEMINI_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent([
          { text: "You are yn AI, a helpful school ERP assistant. Answer concisely in the same language the user asked (Hindi/English/Hinglish). Keep responses short and helpful." },
          { text: command || query },
        ]);
        const response = result.response.text();
        return res.json({ message: response });
      } catch (aiErr: any) {
        console.error("Gemini error:", aiErr.message);
      }
    }

    // Fallback
    return res.json({
      message: "🤖 Main aapki madad kar sakta hoon:\n• Student search\n• Fee receipts\n• Attendance report\n• Stats & analytics\n\nKuch specific poochiye!",
    });
  } catch (error: any) {
    console.error("AI process-command error:", error);
    return res.status(500).json({ message: "❌ Error processing command: " + error.message });
  }
};

// ══════════════════════════════════════════════════════
// SEARCH STUDENTS
// ══════════════════════════════════════════════════════

export const aiSearchStudents = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { query, command } = req.body;
    const searchText = query || command || "";

    // Extract possible name words
    const words = searchText.replace(/[^a-zA-Z\s]/g, "").trim().split(/\s+/).filter((w: string) => w.length > 2);

    if (words.length === 0) {
      return res.json({ message: "🔍 Student ka naam batao search karne ke liye." });
    }

    // Search by name
    const students = await prisma.student.findMany({
      where: {
        tenantId,
        isDeleted: false,
        OR: words.map((word: string) => ({
          OR: [
            { firstName: { contains: word, mode: "insensitive" as any } },
            { lastName: { contains: word, mode: "insensitive" as any } },
            { fatherName: { contains: word, mode: "insensitive" as any } },
          ],
        })),
      },
      include: {
        enrollments: {
          where: { status: "active" },
          include: { class: true, section: true },
          take: 1,
        },
      },
      take: 5,
    });

    if (students.length === 0) {
      return res.json({ message: `🔍 "${searchText}" se koi student nahi mila. Naam sahi se likhein.` });
    }

    let msg = `🔍 **${students.length} Student(s) found:**\n\n`;
    for (const s of students) {
      const enrollment = s.enrollments?.[0];
      const className = (enrollment?.class as any)?.name || "";
      const sectionName = (enrollment?.section as any)?.name || "";
      msg += `• **${s.firstName} ${s.lastName}** — ${className} ${sectionName}\n`;
      msg += `  📱 ${s.fatherPhone || "N/A"} | 👨 ${s.fatherName || "N/A"}\n\n`;
    }

    return res.json({ message: msg });
  } catch (error: any) {
    console.error("AI student search error:", error);
    return res.status(500).json({ message: "❌ Search me error aaya: " + error.message });
  }
};

// ══════════════════════════════════════════════════════
// SEARCH FEES / RECEIPTS
// ══════════════════════════════════════════════════════

export const aiSearchFees = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { query, command } = req.body;
    const searchText = query || command || "";

    // Extract name words
    const words = searchText.replace(/[^a-zA-Z\s]/g, "").trim().split(/\s+/).filter((w: string) => w.length > 2);

    // Search student first
    const students = await prisma.student.findMany({
      where: {
        tenantId,
        isDeleted: false,
        OR: words.length > 0 ? words.map((word: string) => ({
          OR: [
            { firstName: { contains: word, mode: "insensitive" as any } },
            { lastName: { contains: word, mode: "insensitive" as any } },
          ],
        })) : undefined,
      },
      include: {
        enrollments: {
          where: { status: "active" },
          include: {
            class: true,
            studentFees: {
              orderBy: { createdAt: "desc" },
              take: 3,
            },
          },
          take: 1,
        },
      },
      take: 3,
    });

    if (students.length === 0) {
      return res.json({ message: `💰 "${searchText}" — koi student nahi mila fee ke liye.` });
    }

    let msg = `💰 **Fee Status:**\n\n`;
    for (const s of students) {
      const enrollment = s.enrollments?.[0];
      const className = (enrollment?.class as any)?.name || "";
      const fees = enrollment?.studentFees || [];
      const totalPaid = fees.reduce((sum: number, f: any) => sum + (f.paidAmount || 0), 0);
      const totalBalance = fees.reduce((sum: number, f: any) => sum + (f.balanceAmount || 0), 0);

      msg += `📄 **${s.firstName} ${s.lastName}** (${className})\n`;
      msg += `  ✅ Paid: ₹${totalPaid.toLocaleString("en-IN")} | ⏳ Pending: ₹${totalBalance.toLocaleString("en-IN")}\n`;
      msg += `  Status: ${totalBalance > 0 ? "⚠️ Pending" : "✅ Clear"}\n\n`;
    }

    return res.json({ message: msg });
  } catch (error: any) {
    console.error("AI fee search error:", error);
    return res.status(500).json({ message: "❌ Fee search me error: " + error.message });
  }
};

// ══════════════════════════════════════════════════════
// SEARCH ATTENDANCE
// ══════════════════════════════════════════════════════

export const aiSearchAttendance = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { query, command } = req.body;
    const searchText = (query || command || "").toLowerCase();

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const total = await prisma.attendance.count({
      where: { tenantId, date: { gte: today } },
    });
    const present = await prisma.attendance.count({
      where: { tenantId, date: { gte: today }, status: "PRESENT" },
    });
    const absent = await prisma.attendance.count({
      where: { tenantId, date: { gte: today }, status: "ABSENT" },
    });
    const late = await prisma.attendance.count({
      where: { tenantId, date: { gte: today }, status: "LATE" },
    });

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    let msg = `📋 **Today's Attendance (${new Date().toLocaleDateString("en-IN")}):**\n\n`;
    msg += `✅ Present: **${present}**\n`;
    msg += `❌ Absent: **${absent}**\n`;
    msg += `⏰ Late: **${late}**\n`;
    msg += `📊 Attendance Rate: **${rate}%**\n`;
    msg += `📝 Total Marked: **${total}**`;

    if (total === 0) {
      msg = "📋 Aaj ki attendance abhi mark nahi hui hai. Pehle attendance mark karein.";
    }

    return res.json({ message: msg });
  } catch (error: any) {
    console.error("AI attendance search error:", error);
    return res.status(500).json({ message: "❌ Attendance fetch me error: " + error.message });
  }
};

// ══════════════════════════════════════════════════════
// SEARCH REPORT CARD
// ══════════════════════════════════════════════════════

export const aiSearchReportCard = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { query, command } = req.body;
    const searchText = query || command || "";

    // Extract name words
    const words = searchText.replace(/[^a-zA-Z\s]/g, "").trim().split(/\s+/).filter((w: string) => w.length > 2);

    if (words.length === 0) {
      return res.json({ message: "📝 Report card dekhne ke liye student ka naam batao." });
    }

    // Find student
    const students = await prisma.student.findMany({
      where: {
        tenantId,
        isDeleted: false,
        OR: words.map((word: string) => ({
          OR: [
            { firstName: { contains: word, mode: "insensitive" as any } },
            { lastName: { contains: word, mode: "insensitive" as any } },
          ],
        })),
      },
      take: 1,
    });

    if (students.length === 0) {
      return res.json({ message: `📝 "${searchText}" — koi student nahi mila.` });
    }

    const student = students[0];

    // Get marks
    const marks = await prisma.marksEntry.findMany({
      where: { tenantId, studentId: student.id },
      include: { examSubject: { include: { subject: true, exam: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    if (marks.length === 0) {
      return res.json({
        message: `📝 **${student.firstName} ${student.lastName}** ke liye abhi marks entry nahi hui hai.`,
      });
    }

    let msg = `📝 **Report Card — ${student.firstName} ${student.lastName}:**\n\n`;
    let totalObtained = 0;
    let totalMax = 0;

    for (const m of marks) {
      const subName = (m.examSubject as any)?.subject?.name || "Subject";
      const maxMarks = (m.examSubject as any)?.maxMarks || 100;
      const obtained = m.marksObtained || 0;
      totalObtained += obtained;
      totalMax += maxMarks;
      msg += `• ${subName}: **${obtained}/${maxMarks}**\n`;
    }

    const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    msg += `\n📊 **Overall: ${totalObtained}/${totalMax} (${percentage}%)**`;
    msg += `\n${percentage >= 75 ? "🌟 Excellent!" : percentage >= 60 ? "👍 Good" : percentage >= 40 ? "📈 Average" : "⚠️ Needs Improvement"}`;

    return res.json({ message: msg });
  } catch (error: any) {
    console.error("AI report card search error:", error);
    return res.status(500).json({ message: "❌ Report card fetch me error: " + error.message });
  }
};
