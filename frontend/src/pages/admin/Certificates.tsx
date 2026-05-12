import { Link } from 'react-router-dom';

export function AdminCertificatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Certificates</h1>
        <p className="text-sm text-slate-600">Generate attendance and winner certificates.</p>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Certificates are not configured yet for this event.</p>
        <p className="mt-2">
          When enabled, this section will let you generate individual, bulk, and winner certificates from approved
          attendees and judging results. Until then, attendee verification is available via the badge QR code.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/admin/registrations"
            className="rounded-2xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            Open registrations
          </Link>
          <Link
            to="/admin/judging"
            className="rounded-2xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            Open judging
          </Link>
        </div>
      </div>
    </div>
  );
}
