const supportSections = [
  {
    title: 'Orders and Delivery',
    items: [
      'Track current and past orders from your account dashboard.',
      'If delivery is delayed, contact support with your order ID.',
      'For wrong or damaged items, report within 48 hours of delivery.',
    ],
  },
  {
    title: 'Payments and Refunds',
    items: [
      'Payments are processed through secure payment partners.',
      'Refund timelines may vary depending on your payment method.',
      'If payment is debited but order fails, contact support immediately.',
    ],
  },
  {
    title: 'Account and Security',
    items: [
      'Use a strong password and never share your account credentials.',
      'Reset your password from the login page if needed.',
      'Report suspicious account activity as soon as possible.',
    ],
  },
]

export default function HelpCenter() {
  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="space-y-2 border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Help Center</h1>
          <p className="text-sm text-slate-700">Find quick answers for orders, payments, account access, and delivery support.</p>
        </header>

        <div className="space-y-4">
          {supportSections.map((section) => (
            <article key={section.title} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <h2 className="text-base font-bold text-slate-900">Contact Support</h2>
          <p className="mt-2 text-sm text-slate-700">Email: support@shopluxe.com</p>
          <p className="text-sm text-slate-700">Hours: Monday to Saturday, 9:00 AM to 6:00 PM</p>
        </div>
      </div>
    </section>
  )
}
