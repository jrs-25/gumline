export function AppHeader() {
  return (
    <header className="bg-deep">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-baseline justify-between gap-2 px-6 py-5">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tracking-tight text-white">gumline</span>
          <span className="text-base text-white/60">Denial triage</span>
        </div>
        <span className="text-sm text-white/50">
          Demo · mock data · nothing is sent to a payer
        </span>
      </div>
    </header>
  )
}
