import * as z from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const OTP_LENGTH = 6;

export const emailSchema = z
  .email("Enter a valid email address")
  .trim()
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters`);

export const personNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name")
  .max(100, "Keep your name under 100 characters");

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your business name")
  .max(80, "Keep the name under 80 characters");

export const otpSchema = z
  .string()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), "Enter the 6-digit code");

export const signUpSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type SignInInput = z.infer<typeof signInSchema>;

export const emailOnlySchema = z.object({
  email: emailSchema,
});
export type EmailOnlyInput = z.infer<typeof emailOnlySchema>;

export const verifyEmailSchema = z.object({
  otp: otpSchema,
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resetPasswordSchema = z.object({
  otp: otpSchema,
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const welcomeSchema = z.object({
  workspaceName: workspaceNameSchema,
  name: personNameSchema.optional(),
});
export type WelcomeInput = z.infer<typeof welcomeSchema>;
