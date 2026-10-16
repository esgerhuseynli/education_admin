# Flutter Study Bot

An n8n workflow that teaches students Flutter/Dart through Telegram.

- Every day the bot generates a new coding task with OpenAI and sends it to all registered students.
- Students reply with their Dart/Flutter code as text. OpenAI reviews it and replies with a score (0-100), a verdict (pass / partial / fail) and feedback.
- The admin gets a notification for each submission and a daily summary report.
- Data is stored in Neon (Postgres). A read-only web "study board" shows progress from the same database.

## Files

| File | Purpose |
|---|---|
| `Flutter-Academy-Syllabus.pdf` | The 130-day, 6-month course (source of the tasks) |
| `schema.sql` | Neon tables as they exist in production: `students`, `tasks`, `submissions`, `chat_messages` |
| `server.js`, `public/index.html`, `public/icon.png`, `demo-data.js` | Study board: read-only web dashboard on Neon |
| `.env.example` | Env vars for the board (copy to `.env`) |
| `legacy/` | Earlier drafts, kept for reference only (see below) |

## How the bot works

The Telegram bot runs as an n8n workflow that is **not stored in this repository**; it lives in the n8n instance. It follows the PDF:

- Every student starts at Day 1 and works at their own pace. `students.current_day` says which day they are on.
- A task is a row in `tasks` (`day_number` 1-130). The next task arrives on the next weekday at 09:00 (Asia/Baku) after the student passes (70/100 or more). Otherwise they get a friendly reminder and can resubmit.
- Professor Dash, an AI mentor, grades each answer (`submissions`) and chats with the student for hints (`chat_messages`). `tasks.test_focus` holds the grading notes for each day.
- The admin gets submission notices and a report.

To keep the repo complete, export the live workflow from n8n (Workflow menu, Download) and save it here as `n8n-workflow.json`. Remove any credentials before committing.

## Legacy folder

`legacy/` holds an earlier 80-day draft (`SYLLABUS.md`, `TASKS.md`, the `tools/` scripts that generated it) and the first n8n workflow, which released one shared task to everyone each weekday. They do not match the current database, so do not import or run them.

## Study board

A read-only web dashboard (Node + `pg`, no framework) that reads the Neon tables.

- **Overview:** latest task, submitted count, average score, and a leaderboard (average best score, tasks done, passed, attempts, last active).
- **Student details:** click a student to see every submission with score, verdict, AI feedback and code.
- **Task history:** every task with submission count and average score.
- Pass mark is 70 (`PASS_SCORE` in `server.js`).

```bash
npm install
cp .env.example .env   # fill DATABASE_URL
# npm start loads .env automatically
npm start              # http://localhost:3000
```

Try it without a database: `npm run demo` (sample data).
The board has no login, and it shows student names and code. Run it only on your own computer or behind a private network or login (for example a VPN or a reverse proxy with authentication).

## Status

- [x] 130-day syllabus loaded in Neon
- [x] Study board (reads production data)
- [ ] Deploy the board somewhere private (it has no login)
- [ ] Export the live n8n workflow into this repo

## Security

- Do not commit `.env`, `.mcp.json` or any API key. The `.mcp.json` file holds a Neon API key with account-wide access (revoke with `neon api-keys revoke 3395859`).
- The board has no login and shows student names and answers. Run it locally or behind a private network/login.
- Keep Telegram, OpenAI and Neon credentials inside n8n credentials, not in workflow JSON.
