import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-4">Page not found</p>
        <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
          Go back home
        </Link>
      </div>
    </div>
  )
}
