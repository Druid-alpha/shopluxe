const termsSections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using ShopLuxe Global, you agree to comply with these Terms of Service and all applicable laws.',
  },
  {
    title: '2. Accounts',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.',
  },
  {
    title: '3. Orders and Payments',
    body: 'All orders are subject to availability and payment verification. Pricing and product details may change without prior notice.',
  },
  {
    title: '4. Returns and Refunds',
    body: 'Return and refund eligibility depends on item condition, category, and return windows stated in our policies.',
  },
  {
    title: '5. Prohibited Use',
    body: 'You may not misuse the platform, attempt unauthorized access, or use our services for unlawful or harmful activities.',
  },
  {
    title: '6. Limitation of Liability',
    body: 'To the fullest extent permitted by law, ShopLuxe Global is not liable for indirect or consequential damages arising from use of the platform.',
  },
  {
    title: '7. Changes to Terms',
    body: 'We may update these terms from time to time. Continued use of the platform after updates means you accept the revised terms.',
  },
]

export default function TermsOfService() {
  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="space-y-2 border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Terms of Service</h1>
          <p className="text-sm text-slate-600">Last updated: March 7, 2026</p>
          <p className="text-sm text-slate-700">These terms govern your access to and use of ShopLuxe Global services and products.</p>
        </header>

        <div className="space-y-4">
          {termsSections.map((section) => (
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
