-- Neon schema as it exists in production (documented from the live database).
-- The CREATE statements are idempotent; the live n8n workflow owns the writes.

CREATE TABLE IF NOT EXISTS students (
  chat_id          BIGINT PRIMARY KEY,                -- Telegram chat id
  name             TEXT NOT NULL,
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_day      INT NOT NULL DEFAULT 1,            -- syllabus day the student is on
  day_assigned_on  DATE,
  status           TEXT NOT NULL DEFAULT 'new',
  finished         BOOLEAN NOT NULL DEFAULT false,
  last_action_date DATE
);

CREATE TABLE IF NOT EXISTS tasks (                    -- the 130-day syllabus
  id          SERIAL PRIMARY KEY,
  day_number  INT UNIQUE,                             -- 1-130
  task_date   DATE UNIQUE,                            -- legacy, unused by the per-student design
  title       TEXT NOT NULL,
  description TEXT NOT NULL,                          -- the task text sent to the student
  lesson      TEXT,                                   -- the short lesson (Learn part)
  resources   JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{"title": "...", "url": "..."}]
  test_focus  TEXT,                                   -- CHECK / ASK / WATCH FOR / PASS IF notes for the AI mentor
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id         SERIAL PRIMARY KEY,
  task_id    INT NOT NULL REFERENCES tasks(id),
  chat_id    BIGINT NOT NULL REFERENCES students(chat_id),
  code       TEXT NOT NULL,                           -- the student's answer (code or text)
  score      INT,
  verdict    TEXT,                                    -- pass | partial | fail
  feedback   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_submissions_task_chat ON submissions(task_id, chat_id);

CREATE TABLE IF NOT EXISTS chat_messages (            -- conversation memory for Professor Dash
  id           BIGSERIAL PRIMARY KEY,
  chat_id      BIGINT NOT NULL REFERENCES students(chat_id),
  session_date DATE NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'reset')),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(chat_id, session_date, id);
