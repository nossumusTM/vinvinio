import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-white px-6 py-12">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="animate-liquid h-80 w-80 rounded-[28px] border border-neutral-200/60 bg-gradient-to-br from-slate-100 via-indigo-50 to-emerald-50 opacity-80 shadow-[0_40px_140px_-50px_rgba(79,70,229,0.35)] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white p-10 text-center shadow-[0_20px_90px_-32px_rgba(15,23,42,0.25)] ring-1 ring-neutral-200/60 md:p-12">
        {/* <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-inner shadow-neutral-900/25">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
            <path d="M12 2C6.477 2 2 6.486 2 12.018 2 17.54 6.477 22 12 22s10-4.46 10-9.982C22 6.486 17.523 2 12 2Zm0 2c4.411 0 8 3.58 8 8.018C20 16.446 16.411 20 12 20s-8-3.554-8-7.982C4 7.58 7.589 4 12 4Zm0 3a1.25 1.25 0 0 0-1.25 1.25v4.5a1.25 1.25 0 0 0 2.5 0v-4.5A1.25 1.25 0 0 0 12 7Zm0 8a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 12 15Z" />
          </svg>
        </div> */}

        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-neutral-900 md:text-5xl">We couldn&apos;t find that page</h1>
          <p className="text-lg text-neutral-600">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved. Head back to the main screen to keep exploring.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-neutral-900/25 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
          >
            Return to main screen
          </Link>
        </div>
      </div>

    </div>
  );
}