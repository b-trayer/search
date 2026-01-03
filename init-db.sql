-- Database schema for NSU Library Search

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    specialization VARCHAR(100),
    faculty VARCHAR(200),
    course INTEGER,
    interests TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(50) PRIMARY KEY,
    title TEXT NOT NULL,
    authors TEXT[],
    document_type VARCHAR(50) NOT NULL,
    year INTEGER,
    subject VARCHAR(100),
    abstract TEXT,
    isbn VARCHAR(20),
    doi VARCHAR(100),
    pages INTEGER,
    language VARCHAR(10) DEFAULT 'ru',
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_queries (
    query_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    results_count INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS clicks (
    click_id SERIAL PRIMARY KEY,
    query_id INTEGER REFERENCES search_queries(query_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    document_id VARCHAR(50) REFERENCES documents(document_id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    position INTEGER NOT NULL,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dwell_time INTEGER,
    session_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS impressions (
    impression_id SERIAL PRIMARY KEY,
    query_id INTEGER REFERENCES search_queries(query_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    document_id VARCHAR(50) REFERENCES documents(document_id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    position INTEGER NOT NULL,
    shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100)
);

CREATE MATERIALIZED VIEW IF NOT EXISTS ctr_stats AS
SELECT
    i.query_text,
    i.document_id,
    COUNT(DISTINCT i.impression_id) as impressions,
    COUNT(DISTINCT c.click_id) as clicks,
    CASE
        WHEN COUNT(DISTINCT i.impression_id) > 0
        THEN CAST(COUNT(DISTINCT c.click_id) AS FLOAT) / COUNT(DISTINCT i.impression_id)
        ELSE 0
    END as ctr,
    AVG(c.position) as avg_click_position
FROM impressions i
LEFT JOIN clicks c ON
    i.query_text = c.query_text AND
    i.document_id = c.document_id
GROUP BY i.query_text, i.document_id
HAVING COUNT(DISTINCT i.impression_id) >= 3;

CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_document_id ON clicks(document_id);
CREATE INDEX IF NOT EXISTS idx_clicks_query_text ON clicks(query_text);
CREATE INDEX IF NOT EXISTS idx_impressions_query_text ON impressions(query_text);
CREATE INDEX IF NOT EXISTS idx_impressions_document_id ON impressions(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_subject ON documents(subject);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ctr_stats_unique ON ctr_stats(query_text, document_id);

INSERT INTO users (username, email, role, specialization, course, interests) VALUES
('student_ivan', 'ivan@example.com', 'student', 'computer_science', 2, ARRAY['машинное обучение', 'алгоритмы']),
('master_anna', 'anna@example.com', 'master', 'mathematics', 1, ARRAY['теория вероятностей', 'статистика']),
('prof_petrov', 'petrov@example.com', 'professor', 'physics', NULL, ARRAY['квантовая механика', 'термодинамика'])
ON CONFLICT DO NOTHING;
