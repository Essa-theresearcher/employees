import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { apiGet, apiPostJson, ApiError } from '../lib/api';

type Question = {
  id: string;
  attendeeName: string;
  questionText: string;
  upvotes: number;
  isAnswered: boolean;
  createdAt: string;
};

const REFRESH_MS = 5000;

export function QAPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<{ success: boolean; data: Question[] }>('/questions');
      setQuestions(res.data);
    } catch {
      /* silent on poll */
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await apiPostJson('/questions', {
        attendeeName: name.trim(),
        questionText: text.trim()
      });
      setSuccess('Question submitted');
      setText('');
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not submit question.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onUpvote(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiPostJson(`/questions/${encodeURIComponent(id)}/upvote`, {});
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not upvote.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Attendee Portal</p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Coffee and Code Live Q&amp;A</h1>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 px-4 pb-10 pt-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-brand-900">Ask a question</h2>
          <form className="mt-4 space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              Your name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Question
              <textarea
                required
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
              />
            </label>
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {success}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit Question'}
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-brand-900">Questions</h2>
          <div className="space-y-3">
            {questions.map((q) => (
              <article
                key={q.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{q.attendeeName}</p>
                  <p className="mt-1 text-sm text-slate-700">{q.questionText}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">{q.upvotes} upvotes</span>
                    {q.isAnswered && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        Answered
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyId === q.id}
                  onClick={() => void onUpvote(q.id)}
                  className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
                >
                  {busyId === q.id ? '…' : 'Upvote'}
                </button>
              </article>
            ))}
            {questions.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center text-sm text-slate-600">
                No questions yet — be the first to ask.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
