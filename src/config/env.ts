import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/campfire-api"),
  LOG_LEVEL: z.string().optional(),
  COGNITO_USER_POOL_ID: z.string().optional().default(""),
  COGNITO_CLIENT_ID: z.string().optional().default(""),
  AWS_REGION: z.string().optional().default("us-east-1"),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
