// Read-only study board server. Serves public/ and a small JSON API backed by Neon.
try { process.loadEnvFile(); } catch {} // local .env; on Hostinger the app's environment variables are used
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DEMO = process.env.DEMO === '1';
const PASS_SCORE = 70;

if (!DEMO && !process.env.DATABASE_URL) { console.error('DATABASE_URL is required (or run with DEMO=1)'); process.exit(1); }

let pool;
if (!DEMO) {
  const { Pool } = require('pg');
  pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, ssl: { rejectUnauthorized: true } });
}

const SQL = {
  leaderboard: `
    WITH best AS (
      SELECT chat_id, task_id, MAX(score) AS best, COUNT(*) AS attempts, MAX(created_at) AS last
      FROM submissions GROUP BY chat_id, task_id)
    SELECT s.chat_id::text AS chat_id, s.name, s.active, s.current_day,
           COUNT(b.task_id)::int AS tasks_done,
           COALESCE(ROUND(AVG(b.best)), 0)::int AS avg_score,
           COALESCE(SUM(b.attempts), 0)::int AS attempts,
           COALESCE(SUM(b.best), 0)::int AS xp,
           COALESCE(MAX(b.best), 0)::int AS best_score,
           (COUNT(*) FILTER (WHERE b.best >= ${PASS_SCORE}))::int AS passed,
           MAX(b.last) AS last_active
    FROM students s LEFT JOIN best b ON b.chat_id = s.chat_id
    GROUP BY s.chat_id, s.name, s.active, s.current_day
    ORDER BY avg_score DESC, tasks_done DESC, s.name`,
  tasks: `
    SELECT t.id, t.day_number, t.title, t.description,
           COUNT(DISTINCT sub.chat_id)::int AS submitted,
           COALESCE(ROUND(AVG(sub.score)), 0)::int AS avg_score
    FROM tasks t LEFT JOIN submissions sub ON sub.task_id = t.id
    WHERE t.day_number <= (SELECT COALESCE(MAX(current_day), 0) FROM students)
    GROUP BY t.id ORDER BY t.day_number DESC LIMIT 130`,
  active: `SELECT COUNT(*)::int AS n FROM students WHERE active = true`,
  student: `
    SELECT s.id, s.task_id, t.title, t.day_number, s.score, s.verdict,
           s.feedback, s.code, s.created_at
    FROM submissions s JOIN tasks t ON t.id = s.task_id
    WHERE s.chat_id = $1 ORDER BY s.created_at DESC LIMIT 100`,
};

const demo = require('./demo-data');

async function board() {
  if (DEMO) return demo.board();
  const [lb, tasks, active] = await Promise.all([
    pool.query(SQL.leaderboard), pool.query(SQL.tasks), pool.query(SQL.active)]);
  return { passScore: PASS_SCORE, totalDays: 130, activeStudents: active.rows[0].n, leaderboard: lb.rows, tasks: tasks.rows };
}
async function student(id) {
  if (DEMO) return demo.student(id);
  return (await pool.query(SQL.student, [id])).rows;
}

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/board') return send(res, 200, await board());
      const m = url.pathname.match(/^\/api\/student\/(\d{1,20})$/);
      if (m) return send(res, 200, await student(m[1]));
      return send(res, 404, { error: 'not found' });
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return send(res, 200, fs.readFileSync(path.join(__dirname, 'public', 'index.html')), 'text/html; charset=utf-8');
    }
    if (url.pathname === '/icon.png') {
      const buf = fs.readFileSync(path.join(__dirname, 'public', url.pathname.slice(1)));
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' });
      return res.end(buf);
    }
    send(res, 404, 'Not found', 'text/plain');
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'server error' });
  }
}).listen(PORT, () => console.log(`Study board on http://localhost:${PORT}${DEMO ? ' (DEMO data)' : ''}`));
