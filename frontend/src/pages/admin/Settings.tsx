import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPatchJson, ApiError } from '../../lib/api';
import { clearAdminToken, getAdminToken } from '../../lib/auth';

type EventDto = {
  eventName: string;
  amountKes: number;
  mpesaChannelLabel: string;
  mpesaTillOrPaybill: string;
  accountReferenceHint: string;
  scheduleNote: string;
  checkInClosed: boolean;
  teamsPublished: boolean;
  teamCount: number;
  portalOpen: boolean;
};

export function AdminSettingsPage() {
  const navigate = useNavigate();
  const token = getAdminToken()!;

  const [eventName, setEventName] = useState('');
  const [amountKes, setAmountKes] = useState('');
  const [mpesaChannelLabel, setMpesaChannelLabel] = useState('');
  const [mpesaTillOrPaybill, setMpesaTillOrPaybill] = useState('');
  const [accountReferenceHint, setAccountReferenceHint] = useState('');
  const [scheduleNote, setScheduleNote] = useState('');

  const [checkInClosed, setCheckInClosed] = useState(false);
  const [teamsPublished, setTeamsPublished] = useState(false);
  const [teamCount, setTeamCount] = useState(0);
  const [portalOpen, setPortalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiGet<{ success: boolean; data: EventDto }>('/admin/event', token);
      const e = res.data;
      setEventName(e.eventName);
      setAmountKes(String(e.amountKes));
      setMpesaChannelLabel(e.mpesaChannelLabel);
      setMpesaTillOrPaybill(e.mpesaTillOrPaybill);
      setAccountReferenceHint(e.accountReferenceHint);
      setScheduleNote(e.scheduleNote ?? '');
      setCheckInClosed(Boolean(e.checkInClosed));
      setTeamsPublished(Boolean(e.teamsPublished));
      setTeamCount(Number(e.teamCount ?? 0));
      setPortalOpen(Boolean(e.portalOpen));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('Could not load event settings.');
    }
  }, [navigate, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiPatchJson(
        '/admin/event',
        {
          eventName: eventName.trim(),
          amountKes: Number(amountKes),
          mpesaChannelLabel: mpesaChannelLabel.trim(),
          mpesaTillOrPaybill: mpesaTillOrPaybill.trim(),
          accountReferenceHint: accountReferenceHint.trim(),
          scheduleNote: scheduleNote.trim()
        },
        token
      );
      setSuccess('Saved.');
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function setDoorCheckInClosed(closed: boolean) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiPatchJson(
        '/admin/event/check-in',
        { closed },
        token
      );
      setSuccess(closed ? 'Check-in closed. Portal will open once teams are ready.' : 'Check-in reopened.');
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Update failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Event settings</h1>
        <p className="text-sm text-slate-600">Public values shown on the registration page.</p>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>
      )}

      <form className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2" onSubmit={onSave}>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Event title
          <input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Amount (Ksh)
          <input
            type="number"
            min={1}
            step={1}
            value={amountKes}
            onChange={(e) => setAmountKes(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          M-Pesa channel label
          <input
            value={mpesaChannelLabel}
            onChange={(e) => setMpesaChannelLabel(e.target.value)}
            placeholder="e.g. Send Money"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Phone / Till / Paybill
          <input
            value={mpesaTillOrPaybill}
            onChange={(e) => setMpesaTillOrPaybill(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Schedule note
          <input
            value={scheduleNote}
            onChange={(e) => setScheduleNote(e.target.value)}
            placeholder="e.g. Please arrive from 4:30 PM onward."
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Account reference hint
          <input
            value={accountReferenceHint}
            onChange={(e) => setAccountReferenceHint(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Attendee portal phase</h2>
            <p className="mt-1 text-sm text-slate-600">
              Portal opens only when door check-in is closed and at least one team exists.
            </p>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p>
                Check-in: <span className="font-semibold">{checkInClosed ? 'Closed' : 'Open'}</span>
              </p>
              <p>
                Teams: <span className="font-semibold">{teamCount} team{teamCount === 1 ? '' : 's'}</span>
              </p>
              <p>
                Portal: <span className="font-semibold">{portalOpen ? 'Open' : 'Locked (splash screen)'}</span>
              </p>
            </div>
          </div>

          {checkInClosed ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void setDoorCheckInClosed(false)}
              className="shrink-0 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              Re-open check-in
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void setDoorCheckInClosed(true)}
              className="shrink-0 rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
            >
              Close check-in &amp; start portal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
