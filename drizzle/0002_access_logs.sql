CREATE TABLE "access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"login" text NOT NULL,
	"role" "user_role",
	"success" boolean NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null
);--> statement-breakpoint
CREATE INDEX "access_logs_created_at_idx" ON "access_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "access_logs_user_idx" ON "access_logs" USING btree ("user_id");
