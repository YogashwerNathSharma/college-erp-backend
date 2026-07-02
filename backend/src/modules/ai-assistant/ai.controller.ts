import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════
// AI ASSISTANT CONTROLLER (Enhanced)
// Rule-based analysis + statistical predictions
// ══════════════════════════════════════════════════

/**
 * Analyze student performance
 * POST /api/ai/analyze/performance
 */
export const analyzePerformance = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { studentId, classId } = req.body;

    let students: any[] = [];

    if (studentId) {
      // Single student analysis
      const student = await prisma.student.findFirst({
        where: { id: studentId, tenantId },
      });
      if (!student) return res.status(404).json({ success: false, message: "Student not found" });

      const marks = await prisma.marksEntry.findMany({
        where: { tenantId, studentId },
        include: { examSubject: true },
      });

      const attendance = await prisma.attendance.findMany({
        where: { tenantId, studentId },
      });

      // Calculate performance metrics
      const totalMarks = marks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
      const maxMarks = marks.reduce((sum, m) => sum + ((m.examSubject as any)?.maxMarks || 100), 0);
      const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

      const totalAttendance = attendance.length;
      const presentDays = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
      const attendanceRate = totalAttendance > 0 ? (presentDays / totalAttendance) * 100 : 0;

      // Generate insights
      const insights: string[] = [];
      const recommendations: string[] = [];

      if (percentage < 40) {
        insights.push("⚠️ Student is performing below passing threshold");
        recommendations.push("Schedule parent-teacher meeting");
        recommendations.push("Assign extra practice worksheets");
      } else if (percentage < 60) {
        insights.push("📊 Student is performing at average level");
        recommendations.push("Focus on weak subjects identified below");
      } else if (percentage >= 80) {
        insights.push("🌟 Student is excelling academically");
        recommendations.push("Consider for advanced programs or competitions");
      }

      if (attendanceRate < 75) {
        insights.push("🚨 Attendance is critically low (below 75%)");
        recommendations.push("Send attendance warning to parents");
      }

      // Subject-wise analysis
      const subjectPerformance: Record<string, { marks: number; max: number; percentage: number }> = {};
      for (const mark of marks) {
        const subjectName = (mark.examSubject as any)?.subject?.name || "Unknown";
        if (!subjectPerformance[subjectName]) {
          subjectPerformance[subjectName] = { marks: 0, max: 0, percentage: 0 };
        }
        subjectPerformance[subjectName].marks += mark.marksObtained || 0;
        subjectPerformance[subjectName].max += (mark.examSubject as any)?.maxMarks || 100;
      }
      for (const sub of Object.keys(subjectPerformance)) {
        subjectPerformance[sub].percentage = subjectPerformance[sub].max > 0
          ? (subjectPerformance[sub].marks / subjectPerformance[sub].max) * 100
          : 0;
      }

      const weakSubjects = Object.entries(subjectPerformance)
        .filter(([_, v]) => v.percentage < 50)
        .map(([name]) => name);

      const strongSubjects = Object.entries(subjectPerformance)
        .filter(([_, v]) => v.percentage >= 75)
        .map(([name]) => name);

      if (weakSubjects.length > 0) {
        insights.push(`📉 Weak in: ${weakSubjects.join(", ")}`);
      }
      if (strongSubjects.length > 0) {
        insights.push(`💪 Strong in: ${strongSubjects.join(", ")}`);
      }

      const output = {
        overallPercentage: Math.round(percentage * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        totalExams: marks.length,
        subjectPerformance,
        weakSubjects,
        strongSubjects,
        insights,
        recommendations,
        riskLevel: percentage < 40 ? "HIGH" : percentage < 60 ? "MEDIUM" : "LOW",
      };

      // Save analysis
      await prisma.aIAnalysis.create({
        data: {
          tenantId,
          type: "PERFORMANCE",
          entityId: studentId,
          entityType: "STUDENT",
          input: { studentId },
          output,
          insights,
          recommendations,
          score: percentage,
        },
      });

      return res.status(200).json({ success: true, data: output });
    }

    // Class-wide analysis
    if (classId) {
      const classStudents = await prisma.enrollment.findMany({
        where: { tenantId, classId, status: "active" },
        include: { student: true },
      });

      return res.status(200).json({
        success: true,
        data: {
          totalStudents: classStudents.length,
          message: "Class-wide analysis would aggregate individual performances",
        },
      });
    }

    return res.status(400).json({ success: false, message: "studentId or classId required" });
  } catch (error: any) {
    console.error("Performance analysis error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Predict attendance patterns
 * POST /api/ai/predict/attendance
 */
export const predictAttendance = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { classId, days = 7 } = req.body;

    // Get historical attendance data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const where: any = { tenantId, date: { gte: startDate } };
    if (classId) where.classId = classId;

    const attendance = await prisma.attendance.findMany({ where });

    // Calculate patterns
    const dayWise: Record<number, { total: number; present: number }> = {};
    for (const a of attendance) {
      const day = new Date(a.date).getDay();
      if (!dayWise[day]) dayWise[day] = { total: 0, present: 0 };
      dayWise[day].total++;
      if (a.status === "PRESENT" || a.status === "LATE") dayWise[day].present++;
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const predictions = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      const dayData = dayWise[dayOfWeek];
      const predictedRate = dayData && dayData.total > 0
        ? Math.round((dayData.present / dayData.total) * 100)
        : 85; // Default 85%

      predictions.push({
        date: date.toISOString().split("T")[0],
        dayName: dayNames[dayOfWeek],
        predictedAttendanceRate: predictedRate,
        confidence: dayData && dayData.total > 5 ? 0.8 : 0.5,
      });
    }

    // Identify at-risk students (low attendance in last 30 days)
    const studentAttendance: Record<string, { total: number; present: number }> = {};
    for (const a of attendance) {
      if (!a.studentId) continue;
      if (!studentAttendance[a.studentId]) studentAttendance[a.studentId] = { total: 0, present: 0 };
      studentAttendance[a.studentId].total++;
      if (a.status === "PRESENT" || a.status === "LATE") studentAttendance[a.studentId].present++;
    }

    const atRiskStudents = Object.entries(studentAttendance)
      .filter(([_, v]) => v.total > 0 && (v.present / v.total) < 0.75)
      .map(([studentId, v]) => ({
        studentId,
        attendanceRate: Math.round((v.present / v.total) * 100),
      }))
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 10);

    const output = { predictions, atRiskStudents, historicalAverage: 0 };
    const totalP = Object.values(dayWise).reduce((s, d) => s + d.present, 0);
    const totalT = Object.values(dayWise).reduce((s, d) => s + d.total, 0);
    output.historicalAverage = totalT > 0 ? Math.round((totalP / totalT) * 100) : 0;

    await prisma.aIAnalysis.create({
      data: {
        tenantId,
        type: "ATTENDANCE",
        input: { classId, days },
        output,
      },
    });

    return res.status(200).json({ success: true, data: output });
  } catch (error: any) {
    console.error("Attendance prediction error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Predict fee defaulters
 * POST /api/ai/predict/defaulters
 */
export const predictDefaulters = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;

    // Get students with pending fees
    const pendingFees = await prisma.studentFee.findMany({
      where: {
        tenantId,
        status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] },
      },
      include: {
        enrollment: {
          include: { student: true, class: true },
        },
      },
    });

    // Score each student based on risk factors
    const riskAssessment = [];

    for (const fee of pendingFees) {
      const student = fee.enrollment?.student;
      if (!student) continue;

      let riskScore = 0;
      const riskFactors: string[] = [];

      // Factor 1: Overdue duration
      if (fee.dueDate) {
        const daysOverdue = Math.floor((Date.now() - new Date(fee.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 60) {
          riskScore += 40;
          riskFactors.push(`${daysOverdue} days overdue`);
        } else if (daysOverdue > 30) {
          riskScore += 25;
          riskFactors.push(`${daysOverdue} days overdue`);
        } else if (daysOverdue > 0) {
          riskScore += 10;
          riskFactors.push(`${daysOverdue} days overdue`);
        }
      }

      // Factor 2: Amount
      const pendingAmount = (fee.totalAmount || 0) - (fee.paidAmount || 0);
      if (pendingAmount > 50000) {
        riskScore += 20;
        riskFactors.push("High pending amount");
      } else if (pendingAmount > 20000) {
        riskScore += 10;
      }

      // Factor 3: Status
      if (fee.status === "OVERDUE") {
        riskScore += 15;
        riskFactors.push("Already overdue");
      }

      riskAssessment.push({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        className: fee.enrollment?.class?.name || "",
        pendingAmount,
        dueDate: fee.dueDate,
        status: fee.status,
        riskScore: Math.min(riskScore, 100),
        riskLevel: riskScore >= 60 ? "HIGH" : riskScore >= 30 ? "MEDIUM" : "LOW",
        riskFactors,
      });
    }

    // Sort by risk score
    riskAssessment.sort((a, b) => b.riskScore - a.riskScore);

    const output = {
      totalAtRisk: riskAssessment.length,
      highRisk: riskAssessment.filter((r) => r.riskLevel === "HIGH").length,
      mediumRisk: riskAssessment.filter((r) => r.riskLevel === "MEDIUM").length,
      lowRisk: riskAssessment.filter((r) => r.riskLevel === "LOW").length,
      topDefaulters: riskAssessment.slice(0, 20),
      totalPendingAmount: riskAssessment.reduce((s, r) => s + r.pendingAmount, 0),
      recommendations: [
        "Send reminders to HIGH risk students immediately",
        "Schedule parent meetings for top 10 defaulters",
        "Consider offering installment plans for amounts > ₹50,000",
      ],
    };

    await prisma.aIAnalysis.create({
      data: {
        tenantId,
        type: "FEE_PREDICTION",
        input: {},
        output,
      },
    });

    return res.status(200).json({ success: true, data: output });
  } catch (error: any) {
    console.error("Defaulter prediction error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Chat with AI assistant (natural language queries)
 * POST /api/ai/chat
 */
export const chat = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = (req as any).user?.id;
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    // Simple NL query parsing (rule-based for now)
    const query = message.toLowerCase();
    let response = "";
    let actionUrl = "";

    if (query.includes("how many students") || query.includes("total students")) {
      const count = await prisma.student.count({ where: { tenantId, isDeleted: false } });
      response = `There are **${count} students** in the system currently.`;
      actionUrl = "/students";
    } else if (query.includes("how many teachers") || query.includes("total teachers")) {
      const count = await prisma.teacher.count({ where: { tenantId, isActive: true } });
      response = `There are **${count} active teachers** in the system.`;
      actionUrl = "/teachers";
    } else if (query.includes("fee") && (query.includes("pending") || query.includes("due"))) {
      const pending = await prisma.studentFee.aggregate({
        where: { tenantId, status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } },
        _sum: { totalAmount: true },
      });
      const amount = pending._sum?.totalAmount || 0;
      response = `Total pending fees: **₹${amount.toLocaleString("en-IN")}**. Would you like me to list the defaulters?`;
      actionUrl = "/fees/dashboard";
    } else if (query.includes("attendance") && query.includes("today")) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const total = await prisma.attendance.count({ where: { tenantId, date: { gte: today } } });
      const present = await prisma.attendance.count({ where: { tenantId, date: { gte: today }, status: "PRESENT" } });
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      response = `Today's attendance: **${rate}%** (${present}/${total} students marked present).`;
      actionUrl = "/attendance-dashboard";
    } else if (query.includes("upcoming exam")) {
      const exams = await prisma.exam.findMany({
        where: { tenantId, startDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
        take: 3,
      });
      if (exams.length > 0) {
        response = `Upcoming exams:\n${exams.map((e) => `- **${e.name}** (${new Date(e.startDate || Date.now()).toLocaleDateString("en-IN")})`).join("\n")}`;
      } else {
        response = "No upcoming exams scheduled.";
      }
      actionUrl = "/exams";
    } else {
      // Use Gemini for general questions
      const GEMINI_KEY = process.env.GEMINI_API_KEY;
      if (GEMINI_KEY) {
        try {
          const genAI = new GoogleGenerativeAI(GEMINI_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const result = await model.generateContent([
            { text: "You are yn AI, a helpful school ERP assistant. Answer concisely in the same language the user asked (Hindi/English/Hinglish). Keep responses short and helpful. If the question is about school data, say you can help with students, fees, attendance, exams queries." },
            { text: message },
          ]);
          response = result.response.text();
        } catch (aiErr: any) {
          console.error("Gemini error:", aiErr.message);
          response = "I can help you with:\n- Student/Teacher counts\n- Fee status and defaulters\n- Attendance reports\n- Upcoming exams\n- Performance analysis\n\nTry asking: *\"How many students are there?\"* or *\"What's the pending fee?\"*";
        }
      } else {
        response = "I can help you with:\n- Student/Teacher counts\n- Fee status and defaulters\n- Attendance reports\n- Upcoming exams\n- Performance analysis\n\nTry asking: *\"How many students are there?\"* or *\"What's the pending fee?\"*";
      }
    }

    // Save conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, tenantId, userId },
      });
    }

    const newMessages = conversation
      ? [...(conversation.messages as any[]), { role: "user", content: message, timestamp: new Date() }, { role: "assistant", content: response, timestamp: new Date() }]
      : [{ role: "user", content: message, timestamp: new Date() }, { role: "assistant", content: response, timestamp: new Date() }];

    if (conversation) {
      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { messages: newMessages },
      });
    } else {
      conversation = await prisma.aIConversation.create({
        data: {
          tenantId,
          userId,
          title: message.substring(0, 50),
          messages: newMessages,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        response,
        actionUrl,
        conversationId: conversation.id,
      },
    });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get auto-generated insights
 * GET /api/ai/insights
 */
export const getInsights = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get stored insights
    const insights = await prisma.aIInsight.findMany({
      where: { tenantId, isDismissed: false },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // If no insights, generate some basic ones
    if (insights.length === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check attendance
      const totalToday = await prisma.attendance.count({ where: { tenantId, date: { gte: today } } });
      const absentToday = await prisma.attendance.count({ where: { tenantId, date: { gte: today }, status: "ABSENT" } });

      const generatedInsights: any[] = [];

      if (absentToday > 0 && totalToday > 0) {
        const absentRate = Math.round((absentToday / totalToday) * 100);
        if (absentRate > 20) {
          generatedInsights.push({
            type: "ALERT",
            category: "ATTENDANCE",
            title: "High Absence Rate Today",
            description: `${absentRate}% students are absent today (${absentToday} out of ${totalToday}). This is higher than usual.`,
            severity: absentRate > 40 ? "CRITICAL" : "WARNING",
            data: { actionUrl: "/attendance-dashboard", actionLabel: "View Attendance" },
          });
        }
      }

      // Check overdue fees
      const overdueFees = await prisma.studentFee.count({
        where: { tenantId, status: "OVERDUE" },
      });
      if (overdueFees > 0) {
        generatedInsights.push({
          type: "ALERT",
          category: "FEES",
          title: `${overdueFees} Students Have Overdue Fees`,
          description: "Consider sending reminders or scheduling parent meetings.",
          severity: overdueFees > 50 ? "CRITICAL" : "WARNING",
          data: { actionUrl: "/fees/dashboard", actionLabel: "View Defaulters" },
        });
      }

      // Save generated insights
      for (const insight of generatedInsights) {
        await prisma.aIInsight.create({
          data: { tenantId, ...insight },
        });
      }

      return res.status(200).json({ success: true, data: generatedInsights });
    }

    return res.status(200).json({ success: true, data: insights });
  } catch (error: any) {
    console.error("Get insights error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Dismiss an insight
 * PUT /api/ai/insights/:id/dismiss
 */
export const dismissInsight = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const id = req.params.id as string;

    await prisma.aIInsight.updateMany({
      where: { id, tenantId },
      data: { isDismissed: true },
    });

    return res.status(200).json({ success: true, message: "Insight dismissed" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get conversation history
 * GET /api/ai/conversations
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = (req as any).user?.id;

    const conversations = await prisma.aIConversation.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, title: true, messages: true, createdAt: true },
    });

    return res.status(200).json({ success: true, data: conversations });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
