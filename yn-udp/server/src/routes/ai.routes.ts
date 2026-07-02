import { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Available DB fields the template can use
const AVAILABLE_FIELDS = {
  student: [
    "{{student_name}}", "{{first_name}}", "{{last_name}}", "{{father_name}}",
    "{{mother_name}}", "{{dob}}", "{{gender}}", "{{admission_no}}", "{{sr_no}}",
    "{{roll_number}}", "{{class_name}}", "{{section_name}}", "{{phone}}",
    "{{email}}", "{{address}}", "{{blood_group}}", "{{category}}", "{{religion}}",
    "{{nationality}}", "{{aadhar_no}}"
  ],
  school: [
    "{{school_name}}", "{{school_address}}", "{{school_phone}}",
    "{{school_affiliation}}", "{{school_logo}}", "{{principal_name}}"
  ],
  academic: [
    "{{academic_year}}", "{{current_date}}", "{{exam_name}}"
  ],
  fee: [
    "{{receipt_no}}", "{{total_fee}}", "{{paid_amount}}", "{{balance_amount}}",
    "{{payment_date}}", "{{payment_mode}}"
  ]
};

const SYSTEM_PROMPT = `You are a template design AI for a school ERP system. You generate canvas element arrays for documents like ID cards, certificates, report cards, admit cards, fee receipts, and notifications.

OUTPUT FORMAT: Return ONLY a valid JSON array of canvas elements. No explanation, no markdown, no code fences.

Each element must have this exact structure:
{
  "id": "unique_string",
  "type": "rect" | "text" | "field" | "line" | "circle",
  "x": number,
  "y": number,
  "width": number,
  "height": number,
  "rotation": 0,
  "opacity": 1,
  "fill": "#hex or transparent",
  "stroke": "#hex or transparent",
  "strokeWidth": number,
  "borderRadius": number,
  "text": "string (for text/field types)",
  "fontSize": number,
  "fontFamily": "Arial",
  "fontWeight": "normal" | "bold",
  "fontStyle": "normal" | "italic",
  "textDecoration": "none" | "underline",
  "textAlign": "left" | "center" | "right",
  "color": "#hex (text color)"
}

RULES:
1. Use type "field" for dynamic data placeholders (e.g. {{student_name}})
2. Use type "text" for static text (e.g. "STUDENT ID CARD")
3. Use type "rect" for backgrounds, boxes, sections
4. Use type "line" for dividers/separators
5. Use rects with fill for colored sections (headers, footers)
6. Always include a photo placeholder as a rect with text "PHOTO" inside for ID cards
7. Use the EXACT placeholder syntax: {{field_name}}
8. Available fields: ${JSON.stringify(AVAILABLE_FIELDS)}
9. Design must be visually appealing with proper spacing, alignment, and color hierarchy
10. Canvas coordinates start from top-left (0,0)
11. Generate unique IDs like "el_1", "el_2", etc.
12. Header sections should have bold colors, body should be clean
13. Include proper padding/margins (at least 10-15px from edges)

DESIGN PRINCIPLES:
- Professional color schemes (dark headers, white/light body)
- Clear visual hierarchy (school name biggest, then student info)
- Proper spacing between elements (8-15px gaps)
- Border radius for modern look (8-12px on cards)
- Footer with school contact info`;

router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { type, style, description, pageWidth, pageHeight } = req.body;

    if (!GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        message: "GEMINI_API_KEY not configured. Add it in Environment variables.",
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const userPrompt = `Generate a ${type.replace("-", " ")} template design.
Canvas size: ${pageWidth}x${pageHeight} pixels.
Style: ${style}
${description ? `User description: ${description}` : ""}

Return ONLY the JSON array of elements. No other text.`;

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt },
    ]);

    const response = result.response;
    let text = response.text();

    // Clean up response — remove markdown code fences if present
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Parse JSON
    let elements;
    try {
      elements = JSON.parse(text);
    } catch (parseErr) {
      console.error("AI response parse error:", text.substring(0, 500));
      return res.status(500).json({
        success: false,
        message: "AI generated invalid format. Try again.",
      });
    }

    // Validate it's an array
    if (!Array.isArray(elements)) {
      return res.status(500).json({
        success: false,
        message: "AI generated invalid template. Try again.",
      });
    }

    // Sanitize elements - ensure all required fields exist
    const sanitized = elements.map((el: any, i: number) => ({
      id: el.id || `el_${i + 1}`,
      type: el.type || "rect",
      x: Number(el.x) || 0,
      y: Number(el.y) || 0,
      width: Number(el.width) || 100,
      height: Number(el.height) || 50,
      rotation: Number(el.rotation) || 0,
      opacity: el.opacity !== undefined ? Number(el.opacity) : 1,
      fill: el.fill || "transparent",
      stroke: el.stroke || "transparent",
      strokeWidth: Number(el.strokeWidth) || 0,
      borderRadius: Number(el.borderRadius) || 0,
      text: el.text || "",
      fontSize: Number(el.fontSize) || 14,
      fontFamily: el.fontFamily || "Arial",
      fontWeight: el.fontWeight || "normal",
      fontStyle: el.fontStyle || "normal",
      textDecoration: el.textDecoration || "none",
      textAlign: el.textAlign || "left",
      color: el.color || "#000000",
    }));

    res.json({ success: true, data: sanitized });
  } catch (err: any) {
    console.error("AI Generate error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message || "AI generation failed",
    });
  }
});

export default router;
