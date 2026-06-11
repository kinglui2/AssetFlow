export default function SettingsSection({ title, description, children, actions }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {description && <p className="text-sm text-white/60 mt-1">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}
