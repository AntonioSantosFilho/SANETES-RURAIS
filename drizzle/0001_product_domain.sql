CREATE TYPE "public"."user_role" AS ENUM('admin', 'field');--> statement-breakpoint
CREATE TYPE "public"."monitoring_status" AS ENUM('draft', 'synced');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"login" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'field' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "users_login_uidx" ON "users" USING btree ("login");--> statement-breakpoint
ALTER TABLE "systems" ADD COLUMN "coordinates" text;--> statement-breakpoint
ALTER TABLE "systems" ADD COLUMN "residents_count" integer;--> statement-breakpoint
ALTER TABLE "systems" ADD COLUMN "field_user_id" uuid;--> statement-breakpoint
ALTER TABLE "systems" ADD COLUMN "last_visit_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "systems" ADD CONSTRAINT "systems_field_user_id_users_id_fk" FOREIGN KEY ("field_user_id") REFERENCES "public"."users"("id") ON DELETE set null;--> statement-breakpoint
CREATE INDEX "systems_field_user_idx" ON "systems" USING btree ("field_user_id");--> statement-breakpoint
CREATE TABLE "monitorings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"answers" jsonb NOT NULL,
	"report" text,
	"feedback" jsonb NOT NULL,
	"status" "monitoring_status" DEFAULT 'synced' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monitorings_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE cascade,
	CONSTRAINT "monitorings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict
);--> statement-breakpoint
CREATE INDEX "monitorings_system_idx" ON "monitorings" USING btree ("system_id");--> statement-breakpoint
CREATE INDEX "monitorings_created_at_idx" ON "monitorings" USING btree ("created_at");--> statement-breakpoint
CREATE TABLE "monitoring_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitoring_id" uuid NOT NULL,
	"category" text NOT NULL,
	"original_name" text NOT NULL,
	"storage_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monitoring_photos_monitoring_id_monitorings_id_fk" FOREIGN KEY ("monitoring_id") REFERENCES "public"."monitorings"("id") ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX "monitoring_photos_monitoring_idx" ON "monitoring_photos" USING btree ("monitoring_id");
