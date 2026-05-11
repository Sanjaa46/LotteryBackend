-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubmissionResult" AS ENUM ('WIN', 'LOSE');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'CLAIM', 'SUBMIT', 'EXPORT');

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "industry" TEXT,
    "country_code" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "RoleName" NOT NULL DEFAULT 'VIEWER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_participants" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "external_id" TEXT,
    "name" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "external_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_winners" INTEGER NOT NULL,
    "max_submissions_per_participant" INTEGER NOT NULL DEFAULT 1,
    "allow_multiple_prizes" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prizes" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value_usd" DECIMAL(10,2),
    "total_quantity" INTEGER NOT NULL,
    "remaining_quantity" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_batches" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "total_codes" INTEGER NOT NULL,
    "description" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lottery_codes" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "prize_id" INTEGER,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lottery_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "participant_id" INTEGER NOT NULL,
    "lottery_code_id" INTEGER NOT NULL,
    "result" "SubmissionResult" NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "submission_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prize_claims" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "submission_id" INTEGER NOT NULL,
    "participant_id" INTEGER NOT NULL,
    "prize_id" INTEGER NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "approved_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prize_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "actor_id" INTEGER,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "changes_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invitations" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "role" "RoleName" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "accepted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_settings" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "enable_fraud_detection" BOOLEAN NOT NULL DEFAULT true,
    "enable_geo_verification" BOOLEAN NOT NULL DEFAULT false,
    "max_submissions_per_ip" INTEGER NOT NULL DEFAULT 100,
    "gdpr_compliant" BOOLEAN NOT NULL DEFAULT false,
    "data_retention_days" INTEGER NOT NULL DEFAULT 2555,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Organization_created_at_idx" ON "Organization"("created_at");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_idx" ON "organization_members"("organizationId");

-- CreateIndex
CREATE INDEX "organization_members_status_idx" ON "organization_members"("status");

-- CreateIndex
CREATE INDEX "organization_members_role_idx" ON "organization_members"("role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_email_key" ON "organization_members"("organizationId", "email");

-- CreateIndex
CREATE INDEX "external_participants_organizationId_idx" ON "external_participants"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "external_participants_organizationId_email_key" ON "external_participants"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "external_participants_organizationId_external_id_key" ON "external_participants"("organizationId", "external_id");

-- CreateIndex
CREATE INDEX "campaigns_organizationId_status_idx" ON "campaigns"("organizationId", "status");

-- CreateIndex
CREATE INDEX "campaigns_organizationId_created_at_idx" ON "campaigns"("organizationId", "created_at");

-- CreateIndex
CREATE INDEX "campaigns_organizationId_idx" ON "campaigns"("organizationId");

-- CreateIndex
CREATE INDEX "prizes_organization_id_campaignId_idx" ON "prizes"("organization_id", "campaignId");

-- CreateIndex
CREATE INDEX "prizes_campaignId_created_at_idx" ON "prizes"("campaignId", "created_at");

-- CreateIndex
CREATE INDEX "prizes_organization_id_idx" ON "prizes"("organization_id");

-- CreateIndex
CREATE INDEX "code_batches_organization_id_campaign_id_idx" ON "code_batches"("organization_id", "campaign_id");

-- CreateIndex
CREATE INDEX "code_batches_organization_id_idx" ON "code_batches"("organization_id");

-- CreateIndex
CREATE INDEX "lottery_codes_organization_id_campaign_id_is_used_idx" ON "lottery_codes"("organization_id", "campaign_id", "is_used");

-- CreateIndex
CREATE INDEX "lottery_codes_organization_id_is_used_idx" ON "lottery_codes"("organization_id", "is_used");

-- CreateIndex
CREATE INDEX "lottery_codes_organization_id_idx" ON "lottery_codes"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "lottery_codes_organization_id_code_key" ON "lottery_codes"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_lottery_code_id_key" ON "submissions"("lottery_code_id");

-- CreateIndex
CREATE INDEX "submissions_organization_id_campaign_id_idx" ON "submissions"("organization_id", "campaign_id");

-- CreateIndex
CREATE INDEX "submissions_organization_id_participant_id_idx" ON "submissions"("organization_id", "participant_id");

-- CreateIndex
CREATE INDEX "submissions_campaign_id_result_idx" ON "submissions"("campaign_id", "result");

-- CreateIndex
CREATE INDEX "submissions_organization_id_idx" ON "submissions"("organization_id");

-- CreateIndex
CREATE INDEX "submissions_result_idx" ON "submissions"("result");

-- CreateIndex
CREATE INDEX "submissions_created_at_idx" ON "submissions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "prize_claims_submission_id_key" ON "prize_claims"("submission_id");

-- CreateIndex
CREATE INDEX "prize_claims_organization_id_status_idx" ON "prize_claims"("organization_id", "status");

-- CreateIndex
CREATE INDEX "prize_claims_organization_id_participant_id_idx" ON "prize_claims"("organization_id", "participant_id");

-- CreateIndex
CREATE INDEX "prize_claims_campaign_id_status_idx" ON "prize_claims"("campaign_id", "status");

-- CreateIndex
CREATE INDEX "prize_claims_organization_id_idx" ON "prize_claims"("organization_id");

-- CreateIndex
CREATE INDEX "prize_claims_status_idx" ON "prize_claims"("status");

-- CreateIndex
CREATE INDEX "prize_claims_claimed_at_idx" ON "prize_claims"("claimed_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_entity_type_entity_id_idx" ON "audit_logs"("organization_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_actor_id_created_at_idx" ON "audit_logs"("organization_id", "actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_action_idx" ON "audit_logs"("organization_id", "action");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_token_key" ON "organization_invitations"("token");

-- CreateIndex
CREATE INDEX "organization_invitations_token_idx" ON "organization_invitations"("token");

-- CreateIndex
CREATE INDEX "organization_invitations_expires_at_idx" ON "organization_invitations"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_organization_id_email_key" ON "organization_invitations"("organization_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "organization_settings_organization_id_key" ON "organization_settings"("organization_id");

-- CreateIndex
CREATE INDEX "organization_settings_organization_id_idx" ON "organization_settings"("organization_id");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_participants" ADD CONSTRAINT "external_participants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "organization_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "organization_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prizes" ADD CONSTRAINT "prizes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prizes" ADD CONSTRAINT "prizes_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prizes" ADD CONSTRAINT "prizes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "organization_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_batches" ADD CONSTRAINT "code_batches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_batches" ADD CONSTRAINT "code_batches_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_batches" ADD CONSTRAINT "code_batches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "organization_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_codes" ADD CONSTRAINT "lottery_codes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_codes" ADD CONSTRAINT "lottery_codes_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_codes" ADD CONSTRAINT "lottery_codes_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "code_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_codes" ADD CONSTRAINT "lottery_codes_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "prizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "external_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_lottery_code_id_fkey" FOREIGN KEY ("lottery_code_id") REFERENCES "lottery_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_claims" ADD CONSTRAINT "prize_claims_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_claims" ADD CONSTRAINT "prize_claims_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_claims" ADD CONSTRAINT "prize_claims_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_claims" ADD CONSTRAINT "prize_claims_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "external_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_claims" ADD CONSTRAINT "prize_claims_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "prizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_claims" ADD CONSTRAINT "prize_claims_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "organization_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_claims" ADD CONSTRAINT "prize_claims_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "organization_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "organization_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
