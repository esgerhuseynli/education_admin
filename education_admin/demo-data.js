// Sample data for `npm run demo` (no database needed).
const names = ['Aylin', 'Murad', 'Leyla', 'Tural', 'Nigar', 'Rashad'];
const titles = ['Variables & types', 'Null safety', 'Lists & maps', 'Classes', 'Async/await', 'Stateless widget', 'Row & Column'];
const day = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

const leaderboard = names.map((name, i) => ({
  chat_id: String(1000 + i), name, active: i !== 5,
  current_day: 8 - i, tasks_done: 7 - i, avg_score: 92 - i * 9, attempts: 9 - i, xp: (7 - i) * (92 - i * 9), best_score: 100 - i * 8,
  passed: Math.max(0, 6 - i), last_active: new Date(Date.now() - i * 36e5 * 7).toISOString(),
}));
const tasks = titles.map((title, i) => ({
  id: 7 - i, day_number: 7 - i, task_date: day(i), title, description: `Write a short program practicing "${title}".\n\nRequirements:\n- Use idiomatic Dart\n- Handle edge cases\n\nHint: keep it small.`,
  submitted: 5 - (i % 3), avg_score: 80 - i * 3,
}));
exports.board = () => ({ passScore: 70, totalDays: 130, activeStudents: 5, leaderboard, tasks });
exports.student = id => tasks.slice(0, 4).map((t, i) => ({
  id: i, task_id: t.id, title: t.title, day_number: t.day_number, score: 90 - i * 12,
  verdict: i === 3 ? 'fail' : i === 2 ? 'partial' : 'pass',
  feedback: 'Good structure. Consider using `final` for values that never change and add a null check on input.',
  code: `void main() {\n  final name = 'Flutter';\n  print('Hello, $name');\n}`,
  created_at: new Date(Date.now() - i * 864e5).toISOString(),
}));
