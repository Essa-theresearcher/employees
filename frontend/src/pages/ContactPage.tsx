import { Link } from 'react-router-dom';

const WHATSAPP_URL =
  (import.meta.env.VITE_WHATSAPP_URL as string | undefined) ||
  'https://wa.me/254700000000';

export function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Contact</h1>
      <p className="mt-3 text-sm text-slate-600">Reach the organizers for questions about registration or the event.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          WhatsApp
        </a>
        <Link
          to="/register"
          className="inline-flex justify-center rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
