import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F8F4' }}>
      <div className="bg-white p-10 rounded-2xl shadow-md text-center max-w-md w-full">

        <img
          src="/kipl-logo.png"
          alt="KIPL Logo"
          className="mx-auto mb-4 h-20 w-auto"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        <h1 className="text-2xl font-bold text-green-800">
          Kesari Infrabuild Pvt. Ltd.
        </h1>

        <p className="text-gray-600 mt-2 mb-6">
          Compliance dashboard by KIPL for Grammercy
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            className="rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white transition hover:bg-green-800"
            href="/login"
          >
            Sign in
          </Link>

          <Link
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-100"
            href="/dashboard"
          >
            View dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}