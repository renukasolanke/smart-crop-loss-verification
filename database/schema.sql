-- ============================================
-- Smart Crop Loss Verification System
-- Database Schema
-- ============================================

-- Enable PostGIS (already enabled at DB creation, safe to re-run)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- 1. USERS TABLE (Farmers + Admins)
-- ============================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin', 'field_officer')),
    village VARCHAR(100),
    district VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. PLOTS TABLE (Land Parcels - GIS)
-- ============================================
CREATE TABLE plots (
    plot_id SERIAL PRIMARY KEY,
    gat_number VARCHAR(50) NOT NULL,
    owner_name VARCHAR(100),
    village VARCHAR(100),
    taluka VARCHAR(100),
    district VARCHAR(100),
    area_acres NUMERIC(10,2),
    geometry GEOMETRY(Polygon, 4326) NOT NULL,  -- WGS84 coordinate system
    created_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index for fast point-in-polygon queries
CREATE INDEX idx_plots_geometry ON plots USING GIST (geometry);

-- ============================================
-- 3. IMAGES TABLE
-- ============================================
CREATE TABLE images (
    image_id SERIAL PRIMARY KEY,
    image_path VARCHAR(500) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(50),
    device_id VARCHAR(100),
    capture_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast duplicate detection
CREATE INDEX idx_images_hash ON images (sha256_hash);

-- ============================================
-- 4. CLAIMS TABLE
-- ============================================
CREATE TABLE claims (
    claim_id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    plot_id INTEGER REFERENCES plots(plot_id) ON DELETE SET NULL,
    image_id INTEGER REFERENCES images(image_id) ON DELETE SET NULL,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    gps_accuracy NUMERIC(6,2),
    capture_time TIMESTAMP,
    upload_time TIMESTAMP DEFAULT NOW(),
    crop_type VARCHAR(100),
    damage_description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'gis_verified', 'fraud_checked', 'ai_analyzed',
                           'pending_review', 'approved', 'rejected', 'manual_review')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_claims_farmer ON claims (farmer_id);
CREATE INDEX idx_claims_status ON claims (status);

-- ============================================
-- 5. VERIFICATION_RESULTS TABLE
-- ============================================
CREATE TABLE verification_results (
    verification_id SERIAL PRIMARY KEY,
    claim_id INTEGER NOT NULL REFERENCES claims(claim_id) ON DELETE CASCADE,
    gis_result VARCHAR(20),          -- PASS / FAIL
    gps_result VARCHAR(20),          -- GOOD / MODERATE / POOR
    metadata_result VARCHAR(20),     -- PASS / FLAG
    tamper_result VARCHAR(20),       -- PASS / FLAG
    duplicate_result VARCHAR(20),    -- PASS / FLAG
    ai_damage_score NUMERIC(5,2),    -- 0-100 (%)
    satellite_score NUMERIC(5,2),    -- 0-100 (%), nullable if unavailable
    fraud_score NUMERIC(5,2),        -- 0-100 (risk points)
    confidence_score NUMERIC(5,2),   -- 0-100 (final combined score)
    final_result VARCHAR(30),        -- LOW_RISK / MEDIUM_RISK / HIGH_RISK
    admin_remarks TEXT,
    verified_at TIMESTAMP
);

CREATE INDEX idx_verification_claim ON verification_results (claim_id);

-- ============================================
-- 6. AUDIT_LOGS TABLE
-- ============================================
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claims(claim_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    "timestamp" TIMESTAMP DEFAULT NOW(),
    details TEXT
);

CREATE INDEX idx_audit_claim ON audit_logs (claim_id);
