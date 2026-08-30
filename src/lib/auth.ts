import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { sendResetPasswordEmail, sendChangeEmailVerification } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  // Do NOT set requireEmailVerification: true or sendOnSignUp/sendOnSignIn without first
  // adding flow-detection here — this hook is shared with signup email verification, and
  // right now it only fires for the change-email flow.
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendChangeEmailVerification(user.email, url);
    },
  },
  user: {
    changeEmail: {
      enabled: true,
    },
  },
});
