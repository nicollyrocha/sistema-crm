CREATE TABLE "lead_form_submission_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_form_token" (
	"user_id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lead_form_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "lead_form_token" ADD CONSTRAINT "lead_form_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_form_submission_log_ip_idx" ON "lead_form_submission_log" USING btree ("ip");