const sections = [
  {
    title: '1. Information We Collect',
    body: 'We may collect account details, order information, payment references, shipping addresses, device/browser metadata, and support interactions needed to provide and improve our services.',
  },
  {
    title: '2. How We Use Your Data',
    body: 'Your data is used to process orders, prevent fraud, improve shopping experience, send service updates, and comply with legal obligations.',
  },
  {
    title: '3. Data Sharing',
    body: 'We share limited data with payment providers, shipping partners, analytics tools, and service providers only when necessary to operate the platform.',
  },
  {
    title: '4. Data Retention and Security',
    body: 'We retain data for as long as necessary for account operations and legal requirements, and apply administrative and technical safeguards to protect it.',
  },
  {
    title: '5. Your Rights',
    body: 'You can request access, correction, or deletion of your personal data, subject to applicable legal requirements and retention obligations.',
  },
  {
    title: '6. Contact',
    body: 'For privacy requests or concerns, contact our support team via the Help Center page.',
  },
]

export default function PrivacyPolicy() {
  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="space-y-2 border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-600">Last updated: March 7, 2026</p>
          <p className="text-sm text-slate-700">This policy explains how ShopLuxe Global collects, uses, stores, and protects your information when you use our website and services.</p>
        </header>

        <div className="space-y-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{section.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
