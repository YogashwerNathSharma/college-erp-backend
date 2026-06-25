import { Request, Response } from "express";
import {
  generateQuestionPaper,
  generateLessonPlan,
  generateMasterPlan,
  parseGeneratorCommand,
} from "./ai-generators";

/**
 * yn AI — Content Generation Endpoint
 * 
 * Handles:
 * - Question Paper generation
 * - Lesson Plan creation
 * - Master Plan (Annual Academic Plan) creation
 */

export async function generateContent(req: Request, res: Response) {
  try {
    const { type, command, config } = req.body;

    // Use provided config or parse from natural language command
    let generatorConfig = config;
    if (!generatorConfig && command) {
      generatorConfig = parseGeneratorCommand(command, type);
    }

    let result = "";

    switch (type) {
      case "question_paper":
        result = generateQuestionPaper(generatorConfig);
        break;

      case "lesson_plan":
        result = generateLessonPlan(generatorConfig);
        break;

      case "master_plan":
        result = generateMasterPlan(generatorConfig);
        break;

      default:
        return res.status(400).json({
          message: "❌ Invalid generation type. Use: question_paper, lesson_plan, or master_plan",
        });
    }

    return res.json({
      message: result,
      action: {
        type: "show",
        payload: { content: result, contentType: type },
      },
    });
  } catch (error: any) {
    console.error("Content generation error:", error);
    return res.status(500).json({
      message: "❌ Generation me error aaya. Please try again.",
    });
  }
}
