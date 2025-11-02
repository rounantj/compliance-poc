import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'complyance.db');
const db = new Database(dbPath);

// Initialize database schema
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      image TEXT,
      google_id TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      expires DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS compliance_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      document_number TEXT NOT NULL,
      related_documents TEXT,
      bigdata_payload TEXT NOT NULL,
      compliance_analysis TEXT NOT NULL,
      risk_level TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
    CREATE INDEX IF NOT EXISTS idx_reports_user ON compliance_reports(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_created ON compliance_reports(created_at DESC);
  `);
}

// User operations
export function createUser(email: string, name?: string, image?: string, googleId?: string, password?: string) {
  const stmt = db.prepare(`
    INSERT INTO users (email, name, image, google_id, password, last_login)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  return stmt.run(email, name, image, googleId, password);
}

export function getUserByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

export function getUserById(id: number) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

export function getUserByGoogleId(googleId: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE google_id = ?');
  return stmt.get(googleId);
}

export function updateUserLogin(userId: number) {
  const stmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(userId);
}

// Session operations
export function createSession(userId: number, sessionToken: string, expires: Date) {
  const stmt = db.prepare(`
    INSERT INTO sessions (user_id, session_token, expires)
    VALUES (?, ?, ?)
  `);
  return stmt.run(userId, sessionToken, expires.toISOString());
}

export function getSessionByToken(sessionToken: string) {
  const stmt = db.prepare(`
    SELECT s.*, u.* FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = ? AND s.expires > CURRENT_TIMESTAMP
  `);
  return stmt.get(sessionToken);
}

export function deleteSession(sessionToken: string) {
  const stmt = db.prepare('DELETE FROM sessions WHERE session_token = ?');
  return stmt.run(sessionToken);
}

// Compliance report operations
export function createComplianceReport(
  userId: number,
  documentType: string,
  documentNumber: string,
  relatedDocuments: string,
  bigdataPayload: string,
  complianceAnalysis: string,
  riskLevel: string
) {
  const stmt = db.prepare(`
    INSERT INTO compliance_reports 
    (user_id, document_type, document_number, related_documents, bigdata_payload, compliance_analysis, risk_level)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(userId, documentType, documentNumber, relatedDocuments, bigdataPayload, complianceAnalysis, riskLevel);
}

export function getReportsByUser(userId: number, limit = 50, offset = 0) {
  const stmt = db.prepare(`
    SELECT * FROM compliance_reports
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(userId, limit, offset);
}

export function getReportById(reportId: number, userId: number) {
  const stmt = db.prepare(`
    SELECT * FROM compliance_reports
    WHERE id = ? AND user_id = ?
  `);
  return stmt.get(reportId, userId);
}

export function getReportsStats(userId: number) {
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_reports,
      COUNT(CASE WHEN document_type = 'CPF' THEN 1 END) as cpf_count,
      COUNT(CASE WHEN document_type = 'CNPJ' THEN 1 END) as cnpj_count,
      COUNT(CASE WHEN risk_level = 'HIGH' THEN 1 END) as high_risk_count,
      COUNT(CASE WHEN risk_level = 'MEDIUM' THEN 1 END) as medium_risk_count,
      COUNT(CASE WHEN risk_level = 'LOW' THEN 1 END) as low_risk_count
    FROM compliance_reports
    WHERE user_id = ?
  `);
  return stmt.get(userId);
}

// Initialize DB on import
initDB();

export default db;
