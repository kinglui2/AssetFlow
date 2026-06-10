import { supportContacts } from '../../config/support.js'

function SupportCard({ contact }) {
  const phone = contact.phones[0]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-medium text-white">{contact.name}</div>
      <div className="mt-2 space-y-1 text-xs text-white/70">
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
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex-1 text-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs text-white/80"
          >
            Call
          </a>
        )}
      </div>
    </div>
  )
}

export default function AssetflowRightRail() {
  return (
    <div className="lg:block hidden w-[340px] shrink-0">
      <div className="sticky top-0 h-screen overflow-y-auto">
        <div className="border-l border-white/10 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/20 h-full">
          <div className="p-4">
            <div className="text-sm font-semibold text-white">ICT ASSET INVENTORY</div>
            <div className="text-xs text-white/60 mt-1">Support contacts</div>

            <div className="mt-6 space-y-4">
              <SupportCard contact={supportContacts.ict} />
              <SupportCard contact={supportContacts.network} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
