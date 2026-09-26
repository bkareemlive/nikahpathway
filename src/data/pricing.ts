export const plans = {
  fullAccessMonthly: 24.99,
  fullAccessSixMonth: 99.99, // total for 6 months
  lifetime: 229.99,
};

// Launch promotion, open-ended — no fixed end date, just available while it
// lasts. Set active: false to end it.
export const promo = {
  active: true,
  name: "Launch promo",
  durationLabel: "while the offer lasts",
  fullAccessMonthly: 14.99, // per month during the promo
  fullAccessSixMonth: 90, // total for 6 months during the promo
  lifetime: 149.99, // one-time during the promo
};

export const planFeatures = [
  {
    group: "Core",
    rows: [
      { label: "Write a detailed profile", free: true, fullAccess: true, lifetime: true },
      { label: "Look through every member", free: true, fullAccess: true, lifetime: true },
      { label: "Interest requests per month", free: "0", fullAccess: "10, unused carry over once", lifetime: "Unlimited" },
      { label: "Reply to requests you receive", free: true, fullAccess: true, lifetime: true },
      { label: "Withdraw a request you sent", free: false, fullAccess: true, lifetime: true },
    ],
  },
  {
    group: "Search & discovery",
    rows: [
      { label: "Filter by age, location and background", free: true, fullAccess: true, lifetime: true },
      { label: "Filter by height, build, practice and school", free: false, fullAccess: true, lifetime: true },
      { label: "Sort by recent activity", free: false, fullAccess: true, lifetime: true },
      { label: "See who has opened your profile", free: false, fullAccess: true, lifetime: true },
    ],
  },
  {
    group: "Talking",
    rows: [
      { label: "Message the people you have matched with", free: false, fullAccess: true, lifetime: true },
      { label: "Send a gentle reminder", free: false, fullAccess: true, lifetime: true },
      { label: "Access guardian contact details", free: false, fullAccess: true, lifetime: true },
      { label: "Continue on your own messaging app once agreed", free: false, fullAccess: true, lifetime: true },
    ],
  },
  {
    group: "Extras",
    rows: [
      { label: "Faster support replies", free: false, fullAccess: true, lifetime: true },
      { label: "Extra visibility in search", free: false, fullAccess: false, lifetime: true },
      { label: "No adverts", free: false, fullAccess: true, lifetime: true },
      { label: "First access to new features", free: false, fullAccess: false, lifetime: true },
    ],
  },
];

export const pricingFaq = [
  {
    q: "How long does the launch promo last?",
    a: "The launch promo has no fixed end date: it's available while it lasts. Right now Full Access is $14.99 a month and Lifetime is a one-time $149.99. A Lifetime plan bought at the promo price stays at that price for good.",
  },
  {
    q: "How is Full Access different from Lifetime?",
    a: "Full Access is a subscription that opens up every feature you need to match and talk, with 10 interest requests each billing month. Any you have not used carry over into the next month if you renew; if you do not renew, the balance is lost and you start with a fresh 10 whenever you rejoin. Lifetime is a single payment for permanent access with no recurring fee and no monthly cap on requests, matches or profile views.",
  },
  {
    q: "Can I stop a subscription whenever I want?",
    a: "Yes. You can end a subscription from your settings at any time and keep access until the paid period runs out. There is no fee for stopping.",
  },
  {
    q: "What does the six-month option involve?",
    a: "You pay once, up front, for six months at a lower effective monthly rate. It does not roll into another six months unless you choose to renew.",
  },
  {
    q: "Is paying on the site safe?",
    a: "Payments are handled by a PCI-compliant processor. We never receive or keep your full card details.",
  },
  {
    q: "What happens if it is not for me?",
    a: "Every paid plan has a 7-day money-back window. Contact the team within that time for a full refund.",
  },
];
