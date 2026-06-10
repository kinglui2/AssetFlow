export default function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="min-h-screen grid place-items-center text-white/70 text-sm">
      {message}
    </div>
  )
}
