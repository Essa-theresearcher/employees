import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPostMultipart, ApiError } from '../lib/api';
import { CONTRIBUTION_OPTIONS } from '../lib/labels';

type EventDto = {
  eventName: string;
  amountKes: number;
  mpesaChannelLabel: string;
  mpesaTillOrPaybill: string;
  accountReferenceHint: string;
  scheduleNote: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contributionFocus, setContributionFocus] = useState('OPEN_TO_ANY_ROLE');
  const [skillLevel, setSkillLevel] = useState('BEGINNER');
  const [paymentMethod, setPaymentMethod] = useState('MPESA');
  const [mpesaCode, setMpesaCode] = useState('');
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiGet<{ success: boolean; data: EventDto }>('/event');
        setEvent(res.data);
      } catch {
        setError('Unable to load event details. Please try again shortly.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const paymentHint = useMemo(() => {
    if (paymentMethod === 'MPESA') return 'You must include your M-Pesa confirmation details and a screenshot.';
    return 'Upload a receipt screenshot if available (recommended). Admin may verify manually.';
  }, [paymentMethod]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agree) {
      setError('Please confirm you understand badge verification.');
      return;
    }

    if (paymentMethod === 'MPESA') {
      if (!mpesaCode.trim()) {
        setError('M-Pesa transaction code is required.');
        return;
      }
      if (!mpesaMessage.trim()) {
        setError('Please paste your full M-Pesa confirmation message.');
        return;
      }
      if (!screenshot) {
        setError('Please upload your payment screenshot.');
        return;
      }
    }

    const fd = new FormData();
    fd.append('fullName', fullName.trim());
    fd.append('phone', phone.trim());
    fd.append('email', email.trim());
    fd.append('contributionFocus', contributionFocus);
    fd.append('skillLevel', skillLevel);
    fd.append('paymentMethod', paymentMethod);
    fd.append('mpesaTransactionCode', mpesaCode.trim());
    fd.append('mpesaConfirmationMessage', mpesaMessage.trim());
    fd.append('agreementAccepted', agree ? 'true' : 'false');
    if (screenshot) fd.append('screenshot', screenshot);

    setSubmitting(true);
    try {
      const res = await apiPostMultipart<{ success: boolean; data: { id: string } }>(
        '/registrations',
        fd
      );
      navigate(`/status/${res.data.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-50 via-white to-coffee-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:py-16">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/70 px-4 py-2 text-xs font-semibold text-brand-900 shadow-sm backdrop-blur">
            <span className="rounded-full bg-brand-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Invite-only calm
            </span>
            A premium morning for builders who ship.
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">Coffee &amp; Code</h1>
          <p className="max-w-xl text-lg text-slate-600">
            Register in minutes, confirm your payment, and receive a verified attendee badge after our team reviews your
            submission. Honest, human verification — no API theater.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-coffee-100 bg-white p-5 shadow-soft">
              <p className="text-sm font-semibold text-brand-900">Secure verification</p>
              <p className="mt-2 text-sm text-slate-600">Screenshot + confirmation message helps us stop duplicate payments.</p>
            </div>
            <div className="rounded-2xl border border-coffee-100 bg-white p-5 shadow-soft">
              <p className="text-sm font-semibold text-brand-900">Badge you can trust</p>
              <p className="mt-2 text-sm text-slate-600">Every badge includes a QR code linking to a public verification page.</p>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur-lg sm:p-8">
            <div className="mb-6 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-900">Payment instructions</p>
              {loading && <p className="mt-2 text-sm text-slate-600">Loading event details…</p>}
              {!loading && event && (
                <dl className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Event</dt>
                    <dd className="font-semibold text-brand-900">{event.eventName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Amount</dt>
                    <dd className="font-semibold text-brand-900">Ksh {event.amountKes.toLocaleString()}</dd>
                  </div>
                  {event.scheduleNote?.trim() ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Time</dt>
                      <dd className="text-right font-semibold text-brand-900">{event.scheduleNote.trim()}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">{event.mpesaChannelLabel}</dt>
                    <dd className="font-semibold text-brand-900">{event.mpesaTillOrPaybill}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Account reference</dt>
                    <dd className="font-semibold text-coffee-700">{event.accountReferenceHint}</dd>
                  </div>
                </dl>
              )}
              {!loading && !event && <p className="mt-2 text-sm text-red-600">Event settings unavailable.</p>}
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500/40 focus:ring-4"
                    placeholder="e.g. Amina Njeri"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Phone / WhatsApp
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500/40 focus:ring-4"
                    placeholder="+254…"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500/40 focus:ring-4"
                  placeholder="you@domain.com"
                />
              </label>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-slate-800">
                  What would you like to contribute during the event?
                </legend>
                <p className="text-xs text-slate-500">Tap one option — we use this for team formation later.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CONTRIBUTION_OPTIONS.map((opt) => {
                    const selected = contributionFocus === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={[
                          'flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 shadow-sm transition sm:min-h-[3.25rem]',
                          selected
                            ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200/80'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="contributionFocus"
                          value={opt.value}
                          checked={selected}
                          onChange={() => setContributionFocus(opt.value)}
                          className="mt-0.5 h-4 w-4 shrink-0 border-slate-300 text-brand-700 focus:ring-brand-500"
                        />
                        <span className="text-sm font-medium leading-snug text-slate-800">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <label className="block text-sm font-medium text-slate-700">
                Skill level
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500/40 focus:ring-4"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Payment method
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500/40 focus:ring-4"
                >
                  <option value="MPESA">M-Pesa</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank</option>
                </select>
              </label>

              {paymentMethod === 'MPESA' && (
                <div className="space-y-4 rounded-2xl border border-coffee-100 bg-coffee-50/60 p-4">
                  <label className="block text-sm font-medium text-slate-700">
                    M-Pesa transaction code
                    <input
                      value={mpesaCode}
                      onChange={(e) => setMpesaCode(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm uppercase outline-none ring-brand-500/40 focus:ring-4"
                      placeholder="e.g. QKF123456ABC"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Full M-Pesa confirmation message
                    <textarea
                      value={mpesaMessage}
                      onChange={(e) => setMpesaMessage(e.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500/40 focus:ring-4"
                      placeholder="Paste the SMS / confirmation text exactly as received."
                    />
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Payment screenshot {paymentMethod === 'MPESA' ? '(required)' : '(optional)'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                    className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-brand-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">{paymentHint}</p>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                />
                <span>I confirm I have paid and understand my badge will be verified before entry.</span>
              </label>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full rounded-2xl bg-brand-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit registration'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
