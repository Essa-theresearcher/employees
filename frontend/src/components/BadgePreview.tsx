import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

type Props = {
  attendeeName: string;
  badgeId: string;
  contributionLabel: string;
  qrValue: string;
  eventTitle?: string;
};

export const BadgePreview = forwardRef<HTMLDivElement, Props>(function BadgePreview(
  { attendeeName, badgeId, contributionLabel, qrValue, eventTitle = 'Coffee & Code' },
  ref
) {
  return (
    <div
      ref={ref}
      className="w-[720px] max-w-none rounded-3xl border border-coffee-200 bg-gradient-to-br from-white via-brand-50 to-coffee-50 p-10 shadow-soft"
    >
      <div className="flex items-start justify-between gap-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            {eventTitle}
          </div>
          <div>
            <p className="text-sm font-medium text-coffee-600">Attendee</p>
            <h2 className="text-4xl font-bold text-brand-900">{attendeeName}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-slate-500">Badge ID</p>
              <p className="text-lg font-semibold text-brand-900">{badgeId}</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
              <p className="text-lg font-semibold text-coffee-700">Builder</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-slate-500">Contribution</p>
              <p className="text-lg font-semibold text-slate-800">{contributionLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className="text-lg font-semibold text-emerald-700">Paid & Verified</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-5 shadow-inner ring-1 ring-coffee-100">
          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
            <QRCodeSVG value={qrValue} size={160} level="M" includeMargin />
          </div>
          <p className="max-w-[200px] text-center text-xs text-slate-500">
            Scan to open your registration page. After check-in, open it once on this device to unlock teams, Q&amp;A,
            polls, and the leaderboard.
          </p>
        </div>
      </div>
    </div>
  );
});
