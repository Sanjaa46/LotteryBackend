-- ============================================================
--  LOTTERY DATABASE SETUP SCRIPT
--  PostgreSQL compatible
-- ============================================================

-- 1. Create the database (run this as the postgres superuser)
-- Run: sudo -u postgres psql
-- Then paste this line:
-- CREATE DATABASE lottery_db;
-- \c lottery_db

-- ============================================================
--  ENUMS  (PostgreSQL uses custom types instead of ENUM columns)
-- ============================================================

CREATE TYPE user_status      AS ENUM ('active', 'inactive', 'suspended', 'blocked');
CREATE TYPE campaign_status  AS ENUM ('draft', 'active', 'paused', 'ended');
CREATE TYPE submission_result AS ENUM ('win', 'lose');
CREATE TYPE claim_status     AS ENUM ('pending', 'approved', 'rejected', 'delivered');

-- ============================================================
--  TABLES
-- ============================================================

CREATE TABLE users (
    id              SERIAL          PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255)    NOT NULL,
    status          user_status     NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_users_email_format CHECK (email LIKE '%@%.%')
);

-- --------------------------------------------------------

CREATE TABLE roles (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(50)     NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------

CREATE TABLE user_roles (
    user_id     INT     NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    role_id     INT     NOT NULL REFERENCES roles(id)  ON DELETE CASCADE,

    PRIMARY KEY (user_id, role_id)          -- prevents duplicate assignments
);

-- --------------------------------------------------------

CREATE TABLE campaigns (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    start_date  TIMESTAMPTZ     NOT NULL,
    end_date    TIMESTAMPTZ     NOT NULL,
    status      campaign_status NOT NULL DEFAULT 'draft',
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_campaigns_dates CHECK (end_date > start_date)
);

-- --------------------------------------------------------

CREATE TABLE prizes (
    id                  SERIAL          PRIMARY KEY,
    campaign_id         INT             NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
    name                VARCHAR(100)    NOT NULL,
    type                VARCHAR(50)     NOT NULL,
    total_quantity      INT             NOT NULL,
    remaining_quantity  INT             NOT NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_prizes_total_qty      CHECK (total_quantity > 0),
    CONSTRAINT chk_prizes_remaining_qty  CHECK (remaining_quantity >= 0),
    CONSTRAINT chk_prizes_remaining_lte  CHECK (remaining_quantity <= total_quantity)
);

-- --------------------------------------------------------

CREATE TABLE code_batches (
    id              SERIAL          PRIMARY KEY,
    campaign_id     INT             NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
    total_codes     INT             NOT NULL,
    generated_by    INT             NOT NULL REFERENCES users(id)     ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_code_batches_total CHECK (total_codes > 0)
);

-- --------------------------------------------------------

CREATE TABLE lottery_codes (
    id          SERIAL          PRIMARY KEY,
    code        VARCHAR(50)     NOT NULL UNIQUE,
    campaign_id INT             NOT NULL REFERENCES campaigns(id)    ON DELETE RESTRICT,
    batch_id    INT             NOT NULL REFERENCES code_batches(id) ON DELETE RESTRICT,
    prize_id    INT                      REFERENCES prizes(id)       ON DELETE SET NULL,
    is_used     BOOLEAN         NOT NULL DEFAULT FALSE,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- if is_used is true, used_at must be set
    CONSTRAINT chk_lottery_codes_used_at CHECK (
        (is_used = FALSE AND used_at IS NULL) OR
        (is_used = TRUE  AND used_at IS NOT NULL)
    )
);

-- --------------------------------------------------------

CREATE TABLE submissions (
    id              SERIAL              PRIMARY KEY,
    user_id         INT                 NOT NULL REFERENCES users(id)         ON DELETE RESTRICT,
    lottery_code_id INT                 NOT NULL UNIQUE                       -- one submission per code
                                                 REFERENCES lottery_codes(id) ON DELETE RESTRICT,
    result          submission_result   NOT NULL,
    ip_address      VARCHAR(45)         NOT NULL,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------

CREATE TABLE prize_claims (
    id              SERIAL          PRIMARY KEY,
    submission_id   INT             NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE RESTRICT,
    user_id         INT             NOT NULL        REFERENCES users(id)       ON DELETE RESTRICT,
    prize_id        INT             NOT NULL        REFERENCES prizes(id)      ON DELETE RESTRICT,
    status          claim_status    NOT NULL DEFAULT 'pending',
    claimed_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    delivered_at    TIMESTAMPTZ,

    CONSTRAINT chk_prize_claims_delivered CHECK (
        (status = 'delivered' AND delivered_at IS NOT NULL) OR
        (status <> 'delivered')
    )
);

-- --------------------------------------------------------

CREATE TABLE audit_logs (
    id          SERIAL          PRIMARY KEY,
    user_id     INT             REFERENCES users(id) ON DELETE SET NULL,  -- keep log even if user deleted
    action      VARCHAR(100)    NOT NULL,
    entity_type VARCHAR(50)     NOT NULL,
    entity_id   INT             NOT NULL,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(255),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
--  INDEXES  (speeds up common queries)
-- ============================================================

CREATE INDEX idx_lottery_codes_campaign   ON lottery_codes(campaign_id);
CREATE INDEX idx_lottery_codes_is_used    ON lottery_codes(is_used);
CREATE INDEX idx_submissions_user         ON submissions(user_id);
CREATE INDEX idx_submissions_created_at   ON submissions(created_at);
CREATE INDEX idx_prize_claims_user        ON prize_claims(user_id);
CREATE INDEX idx_prize_claims_status      ON prize_claims(status);
CREATE INDEX idx_audit_logs_user          ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity        ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at    ON audit_logs(created_at);

-- ============================================================
--  SEED DATA  (default roles)
-- ============================================================

INSERT INTO roles (name) VALUES ('superadmin'), ('admin'), ('user');