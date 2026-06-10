import { supportContacts } from '../../config/support.js'

const SCHOOL_LOGO =
  'https://static.wixstatic.com/media/57fa13_baa64a5d85284931bdb412f4022c84db~mv2.jpg/v1/fill/w_284,h_284,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Mirema%20School%20Logo.jpg'

function SupportPanel({ contact }) {
  const phone = contact.phones[0]?.replace(/\s/g, '')

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-medium text-white">{contact.name}</div>
      <div className="mt-2 text-xs text-white/70 space-y-1">
        <div>
          <span className="text-white/60">Phone:</span> {contact.phones.join(', ')}
        </div>
        <div>
          <span className="text-white/60">Email:</span> {contact.email}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <a
          href={`mailto:${contact.email}`}
          className="flex-1 text-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs text-white/80"
        >
          Email
        </a>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex-1 text-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs text-white/80"
          >
            Call
          </a>
        )}
      </div>
    </div>
  )
}

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6">
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-7 shadow-glow overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <img
              src={SCHOOL_LOGO}
              alt="Mirema School Logo"
              className="h-full w-full object-cover object-center opacity-15"
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-brandAmber-500/20 ring-1 ring-brandAmber-500/35 grid place-items-center overflow-hidden">
                <img src={SCHOOL_LOGO} alt="Mirema School Logo" className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide text-white">ICT ASSET INVENTORY</div>
                <div className="text-xs text-white/60">ICT Department</div>
              </div>
            </div>

            <h1 className="mt-6 text-2xl font-semibold text-white">{title}</h1>
            <p className="text-sm text-white/60 mt-2">{subtitle}</p>

            <div className="mt-6">{children}</div>

            <div className="mt-6 text-xs text-white/55">
              By continuing you agree to internal ICT policies.
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="h-full rounded-2xl border border-white/10 bg-gradient-to-b from-brandAmber-500/10 to-transparent p-8">
            <div className="text-sm text-white/60 uppercase tracking-widest">ASSETFLOW</div>
            <div className="mt-6 space-y-4">
              <SupportPanel contact={supportContacts.ict} />
              <SupportPanel contact={supportContacts.network} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
