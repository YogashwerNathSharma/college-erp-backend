import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

/**
 * Environment variable validation using Zod
 * Fails fast on startup if required vars are missing
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000"),
  HOST: z.string().default("0.0.0.0"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // JWT
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  CORS_CREDENTIALS: z.string().default("true"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  // SMTP / Email
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.string().default("587"),
  SMTP_SECURE: z.string().default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().default("School ERP"),

  // SMS
  SMS_API_KEY: z.string().optional(),
  SMS_API_URL: z.string().optional(),
  SMS_SENDER_ID: z.string().default("SCHOOL"),

  // WhatsApp
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_API_URL: z.string().default("https://graph.facebook.com/v17.0"),

  // Firebase
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),

  // Redis (optional cache)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379"),
  REDIS_PASSWORD: z.string().optional(),

  // Backup
  BACKUP_DIR: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("900000"), // 15 minutes
  RATE_LIMIT_MAX: z.string().default("100"),

  // File Upload
  MAX_FILE_SIZE: z.string().default("10485760"), // 10MB
  UPLOAD_DIR: z.string().default("uploads"),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missing = error.issues.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n");
    console.error(`\n❌ Environment validation failed:\n${missing}\n`);
    process.exit(1);
  }
  throw error;
}

export default env;
export { env };
