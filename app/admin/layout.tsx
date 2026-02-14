import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-semibold">Analytics Dashboard</h1>
              <nav className="flex gap-4">
                <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                  Overview
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-sm text-gray-600">Back to App</a>
              <form action="/api/admin/logout" method="POST">
                <button type="submit" className="text-sm text-red-600 hover:text-red-700">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
