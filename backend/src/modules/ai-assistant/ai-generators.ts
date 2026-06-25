/**
 * yn AI — AI Content Generators
 * 
 * These functions generate:
 * 1. Question Papers
 * 2. Lesson Plans
 * 3. Master Plans (Annual Academic Plan)
 * 
 * NOTE: For production, integrate with OpenAI/Gemini API.
 * This version uses template-based generation.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUESTION PAPER GENERATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface PaperConfig {
  subject: string;
  className: string;
  examType: string;
  totalMarks: number;
  difficulty: string;
}

export function generateQuestionPaper(config: PaperConfig): string {
  const { subject, className, examType, totalMarks, difficulty } = config;

  return `📄 **QUESTION PAPER**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Subject: ${subject}
🏫 Class: ${className}
📝 Exam: ${examType}
📊 Total Marks: ${totalMarks}
⚡ Difficulty: ${difficulty}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Section A — MCQ (${Math.round(totalMarks * 0.2)} marks)**
(1 mark each, choose the correct answer)

1. ___________________________
2. ___________________________
3. ___________________________
4. ___________________________
5. ___________________________

**Section B — Short Answer (${Math.round(totalMarks * 0.3)} marks)**
(2-3 marks each)

6. ___________________________
7. ___________________________
8. ___________________________
9. ___________________________
10. __________________________

**Section C — Long Answer (${Math.round(totalMarks * 0.3)} marks)**
(5 marks each)

11. __________________________
12. __________________________
13. __________________________

**Section D — HOTS/Case Study (${Math.round(totalMarks * 0.2)} marks)**

14. __________________________
15. __________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Full AI-generated paper ke liye OpenAI/Gemini API integrate karein.
Ab aap "/exams/question-paper" page par jaake customize kar sakte hain.`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LESSON PLAN GENERATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface LessonPlanConfig {
  subject: string;
  className: string;
  topic: string;
  duration: string;
  board: string;
}

export function generateLessonPlan(config: LessonPlanConfig): string {
  const { subject, className, topic, duration, board } = config;

  return `📋 **LESSON PLAN**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Subject: ${subject}
🏫 Class: ${className}
📖 Topic: ${topic}
⏰ Duration: ${duration}
📋 Board: ${board}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. Learning Objectives:**
• Students will understand the concept of ${topic}
• Students will be able to apply ${topic} in problems
• Students will analyze and evaluate related scenarios

**2. Teaching Method:**
• Lecture + Discussion (15 min)
• Visual Aids / PPT (10 min)
• Activity / Group Work (15 min)
• Practice Questions (10 min)
• Recap & Q&A (5 min)

**3. Materials Required:**
• Textbook (Chapter reference)
• Whiteboard & Markers
• Projector / Smart Board
• Worksheets
• Models/Charts (if applicable)

**4. Procedure:**

| Time | Activity | Method |
|------|----------|--------|
| 5 min | Introduction & Motivation | Storytelling/Question |
| 15 min | Concept Explanation | Lecture + PPT |
| 10 min | Examples & Demonstration | Board Work |
| 10 min | Student Activity | Group/Pair Work |
| 5 min | Assessment | Quick Quiz |
| 5 min | Summary & Homework | Discussion |

**5. Assessment:**
• Oral questions during class
• Written worksheet
• Homework assignment
• Next day quick test

**6. Homework:**
• Textbook exercise questions
• 5 practice problems on ${topic}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Lesson Plan ready! Customize as needed.`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MASTER PLAN GENERATOR (Annual Academic Plan)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface MasterPlanConfig {
  academicYear: string;
  classRange: string;
  board: string;
}

export function generateMasterPlan(config: MasterPlanConfig): string {
  const { academicYear, classRange, board } = config;

  return `📊 **ANNUAL MASTER PLAN ${academicYear}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏫 Classes: ${classRange}
📋 Board: ${board}
📅 Academic Year: ${academicYear}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📅 MONTHLY BREAKDOWN:**

| Month | Academic | Exams | Activities |
|-------|----------|-------|------------|
| April | Session Start, Orientation | — | Welcome Assembly |
| May | Regular Teaching | Unit Test 1 | Summer Camp |
| June | Summer Break | — | Teacher Training |
| July | Resume Teaching | — | Science Fair Prep |
| August | Independence Day Events | Unit Test 2 | Sports Week |
| September | Mid-Term Prep | Half Yearly Exam | Teacher's Day |
| October | Festive Break + Revision | — | Diwali Celebration |
| November | Regular Teaching | Unit Test 3 | Annual Day Prep |
| December | Winter Activities | — | Christmas Event |
| January | Pre-Board Prep (Seniors) | Pre-Board | Republic Day |
| February | Annual Exam Prep | Annual Exam | Farewell (Seniors) |
| March | Result & Promotion | Final Results | New Session Prep |

**📝 EXAM SCHEDULE:**
• Unit Test 1: May (Week 3-4)
• Unit Test 2: August (Week 3-4)
• Half Yearly: September (Week 3-4)
• Unit Test 3: November (Week 3-4)
• Pre-Board: January (Week 2-3) — Class 10, 12 only
• Annual Exam: February (Week 3) - March (Week 1)

**🎉 IMPORTANT EVENTS:**
• PTM: Monthly (Last Saturday)
• Sports Day: November
• Annual Day: December
• Science Exhibition: July
• Art & Craft Fair: October
• Farewell: February (Seniors)

**📚 SYLLABUS COMPLETION TARGET:**
• By Half Yearly: 50% syllabus
• By Pre-Board: 85% syllabus
• By Annual: 100% syllabus + Revision

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Master Plan ready! Customize dates per your school calendar.`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PARSER — Extract config from natural language
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function parseGeneratorCommand(command: string, type: string): any {
  const lower = command.toLowerCase();

  // Extract subject
  const subjectMatch = lower.match(/(?:subject|sub)\s*(?::|is)?\s*(\w+)/i) ||
    lower.match(/(math(?:ematics|s)?|science|english|hindi|social|physics|chemistry|biology|history|geography|economics|computer|sanskrit)/i);
  const subject = subjectMatch ? subjectMatch[1] : "General";

  // Extract class
  const classMatch = lower.match(/class\s*(\d+)/i) || lower.match(/(\d+)\s*(?:th|st|nd|rd)/i);
  const className = classMatch ? `Class ${classMatch[1]}` : "All Classes";

  // Extract marks
  const marksMatch = lower.match(/(\d+)\s*marks/i);
  const totalMarks = marksMatch ? parseInt(marksMatch[1]) : 80;

  // Extract exam type
  const examType = /annual/i.test(lower) ? "Annual Exam" :
    /half\s*yearly/i.test(lower) ? "Half Yearly" :
    /unit\s*test/i.test(lower) ? "Unit Test" : "General Exam";

  // Extract difficulty
  const difficulty = /hard|difficult|tough/i.test(lower) ? "Hard" :
    /easy|simple/i.test(lower) ? "Easy" :
    /mixed/i.test(lower) ? "Mixed" : "Medium";

  // Extract topic
  const topicMatch = lower.match(/topic\s*(?::|is)?\s*["']?([^"']+)["']?/i) ||
    lower.match(/(?:chapter|lesson)\s*(?::|is)?\s*["']?([^"']+)["']?/i);
  const topic = topicMatch ? topicMatch[1].trim() : subject;

  // Extract duration
  const durationMatch = lower.match(/(\d+)\s*(?:week|day|period)/i);
  const duration = durationMatch ? `${durationMatch[0]}` : "1 Week";

  // Extract board
  const board = /icse/i.test(lower) ? "ICSE" :
    /state/i.test(lower) ? "State Board" : "CBSE";

  // Extract academic year
  const yearMatch = lower.match(/(20\d{2}\s*-\s*\d{2})/);
  const academicYear = yearMatch ? yearMatch[1] : "2025-26";

  switch (type) {
    case "question_paper":
      return { subject, className, examType, totalMarks, difficulty };
    case "lesson_plan":
      return { subject, className, topic, duration, board };
    case "master_plan":
      return { academicYear, classRange: className, board };
    default:
      return {};
  }
}
