-- Run this once against birth_cert_db after creating it (Phase 3 setup).
-- psql -U birth_cert_user -d birth_cert_db -f schema.sql

CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    cert_id VARCHAR UNIQUE NOT NULL,
    applicant_name VARCHAR NOT NULL,
    date_of_birth DATE NOT NULL,
    place_of_birth VARCHAR NOT NULL,
    pdf_path VARCHAR NOT NULL,
    sha256_hash VARCHAR NOT NULL,
    tx_hash VARCHAR,
    status VARCHAR DEFAULT 'pending', -- 'pending' | 'issued'
    issued_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    cert_id VARCHAR REFERENCES certificates(cert_id),
    type VARCHAR NOT NULL, -- 'issuance' | 'verification'
    wallet_address VARCHAR NOT NULL,
    tx_hash VARCHAR NOT NULL,
    amount_eth NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
