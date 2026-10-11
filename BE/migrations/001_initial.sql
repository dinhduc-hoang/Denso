CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  role ENUM('admin','coordinator','expert','engineer','worker') NOT NULL,
  password_hash VARCHAR(300) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (expires_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS meetings (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  machine VARCHAR(100) NOT NULL,
  station VARCHAR(100) NOT NULL,
  product VARCHAR(100) NOT NULL,
  segments JSON NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) NOT NULL UNIQUE,
  status ENUM('draft','revision_requested','approved') NOT NULL DEFAULT 'draft',
  revision INT NOT NULL DEFAULT 1,
  document JSON NOT NULL,
  decision TEXT NOT NULL,
  approved_by VARCHAR(64) NULL,
  approved_at DATETIME(3) NULL,
  revision_reason TEXT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS knowledge (
  id VARCHAR(64) PRIMARY KEY,
  report_id VARCHAR(64) NULL UNIQUE,
  error_code VARCHAR(100) NOT NULL,
  title VARCHAR(300) NOT NULL,
  machine VARCHAR(100) NOT NULL,
  station VARCHAR(100) NOT NULL,
  product VARCHAR(100) NOT NULL,
  current_version INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_until DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (report_id) REFERENCES reports(id),
  INDEX retrieval_scope (machine,station,product,is_active)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR(64) PRIMARY KEY,
  query TEXT NOT NULL,
  machine VARCHAR(100) NOT NULL,
  station VARCHAR(100) NOT NULL,
  product VARCHAR(100) NOT NULL,
  feedback TEXT NOT NULL,
  reason ENUM('unknown','ineffective','out_of_scope') NOT NULL,
  knowledge_id VARCHAR(64) NULL,
  knowledge_version INT NULL,
  status ENUM('open','in_progress','resolved') NOT NULL DEFAULT 'open',
  created_by VARCHAR(64) NOT NULL,
  assigned_to VARCHAR(64) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (knowledge_id) REFERENCES knowledge(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  INDEX (status,created_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS files (
  id VARCHAR(64) PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  storage_name VARCHAR(100) NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT NOT NULL,
  meeting_id VARCHAR(64) NULL,
  incident_id VARCHAR(64) NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id),
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS notes (
  id VARCHAR(64) PRIMARY KEY,
  incident_id VARCHAR(64) NOT NULL,
  cause TEXT NOT NULL,
  action TEXT NOT NULL,
  conditions TEXT NOT NULL,
  evidence_ids JSON NOT NULL,
  base_version INT NULL,
  status ENUM('draft','revision_requested','approved') NOT NULL DEFAULT 'draft',
  created_by VARCHAR(64) NOT NULL,
  approved_by VARCHAR(64) NULL,
  approved_at DATETIME(3) NULL,
  revision_reason TEXT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS knowledge_versions (
  knowledge_id VARCHAR(64) NOT NULL,
  version INT NOT NULL,
  document JSON NOT NULL,
  source_note_id VARCHAR(64) NULL,
  approved_by VARCHAR(64) NOT NULL,
  approved_at DATETIME(3) NOT NULL,
  PRIMARY KEY (knowledge_id,version),
  FOREIGN KEY (knowledge_id) REFERENCES knowledge(id),
  FOREIGN KEY (source_note_id) REFERENCES notes(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS feedback (
  id VARCHAR(64) PRIMARY KEY,
  knowledge_id VARCHAR(64) NOT NULL,
  version INT NOT NULL,
  incident_id VARCHAR(64) NULL,
  result ENUM('effective','ineffective') NOT NULL,
  comment TEXT NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (knowledge_id,version) REFERENCES knowledge_versions(knowledge_id,version),
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS audit_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id VARCHAR(64) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB;
