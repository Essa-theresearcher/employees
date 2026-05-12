import { Link } from 'react-router-dom';

export function ThanksPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-16 text-center">
      <div className="max-w-lg rounded-3xl border border-brand-100 bg-white p-10 shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">✓</div>
        <h1 className="mt-6 text-3xl font-bold text-brand-900">Registration received</h1>
        <p className="mt-4 text-slate-600">
          Registration received. Your payment is pending verification. Once approved, your badge will be sent or downloaded.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/15 hover:bg-brand-700"
          >
            Back to registration
          </Link>
        </div>
      </div>
    </div>
  );
}
