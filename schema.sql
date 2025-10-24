-- Schema untuk database temp mail
CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    to_address TEXT NOT NULL,
    from_address TEXT NOT NULL,
    from_name TEXT,
    subject TEXT,
    html_content TEXT,
    text_content TEXT,
    attachments TEXT, -- JSON string
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_received DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_to_address ON emails(to_address);
CREATE INDEX IF NOT EXISTS idx_date_created ON emails(date_created DESC);
CREATE INDEX IF NOT EXISTS idx_to_address_date ON emails(to_address, date_created DESC);

-- Auto cleanup untuk email yang sudah expired (1 hari)
CREATE TRIGGER IF NOT EXISTS cleanup_old_emails
    AFTER INSERT ON emails
    BEGIN
        DELETE FROM emails 
        WHERE date_created < datetime('now', '-1 day');
    END;
