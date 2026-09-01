CREATE INDEX "contact_user_id_idx" ON "contact" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deal_user_id_idx" ON "deal" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deal_contact_id_idx" ON "deal" USING btree ("contact_id");