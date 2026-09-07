DROP INDEX "lead_form_submission_log_ip_idx";--> statement-breakpoint
CREATE INDEX "lead_form_submission_log_ip_idx" ON "lead_form_submission_log" USING btree ("ip","submitted_at");