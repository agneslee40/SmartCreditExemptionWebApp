-- ============================
-- Table: users (PL & SL accounts)
-- ============================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) CHECK (role IN ('PL', 'SL', 'Admin')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- Table: applications
-- ============================
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  application_id VARCHAR(20) UNIQUE NOT NULL,      -- e.g., A001
  student_name VARCHAR(255) NOT NULL,
  student_id VARCHAR(50),
  intake VARCHAR(20),
  semester VARCHAR(20),
  qualification VARCHAR(255),
  former_institution VARCHAR(255),
  requested_subject VARCHAR(255),
  type VARCHAR(50),                                -- credit exemption / transfer
  date_submitted DATE DEFAULT CURRENT_DATE,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL, 
  ai_score FLOAT,
  ai_decision VARCHAR(20),
  final_decision VARCHAR(20),
  status VARCHAR(50) DEFAULT 'Pending',
  remarks TEXT,
  document_path TEXT;
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- Table: documents
-- ============================
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- Table: ai_analysis (python output)
-- ============================
CREATE TABLE IF NOT EXISTS ai_analysis (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  similarity FLOAT,
  grade_detected VARCHAR(10),
  credit_hours INTEGER,
  decision VARCHAR(20),
  reasoning JSONB,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- Table: comments (PL & SL discussions)
-- ============================
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- Table: version_history
-- ============================
CREATE TABLE IF NOT EXISTS version_history (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  field_changed VARCHAR(255),
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
