/**
 * Apartment Society Legal, Privacy Policy, Payments & Terms of Service Content
 * Tailored specifically for Apartment Complexes, Gated Communities, and RWAs.
 */

export interface PolicyClause {
  id: string;
  title: string;
  badge?: string;
  summary: string;
  details: string[];
  keyHighlights?: string[];
  legalReference?: string;
}

export interface PolicySection {
  key: 'PRIVACY' | 'PAYMENT' | 'TERMS' | 'SECURITY';
  title: string;
  shortTitle: string;
  icon: string;
  tagline: string;
  lastUpdated: string;
  clauses: PolicyClause[];
}

export const APARTMENT_LEGAL_SECTIONS: PolicySection[] = [
  {
    key: 'PRIVACY',
    title: 'Apartment Society Privacy Policy',
    shortTitle: 'Privacy',
    icon: 'shield-checkmark',
    tagline: 'How resident personal data, visitor logs, and gate security records are protected.',
    lastUpdated: 'September 2026',
    clauses: [
      {
        id: 'PRIV_DATA_COLLECTION',
        title: '1. Resident Data Collection & Purpose Limitation',
        badge: 'DPDP Act 2023 Compliant',
        summary: 'We collect only essential details necessary for apartment administration and security.',
        details: [
          'Personal identification data collected includes resident full name, flat number, tower, verified mobile number, email address, and registered vehicle numbers.',
          'Tenancy classification (Owner vs. Tenant) is documented to route voting privileges, billing notifications, and committee announcements appropriately.',
          'Data is processed solely for property maintenance, billing, emergency safety alerts, amenity reservation verification, and gate security.',
          'The society management and platform will NEVER sell, lease, or monetize resident personal data to third-party commercial advertisers or brokers.',
        ],
        keyHighlights: [
          'Zero commercial marketing or selling of resident phone numbers',
          'Access strictly partitioned by verified society identity',
        ],
        legalReference: 'Digital Personal Data Protection Act (DPDP), 2023',
      },
      {
        id: 'PRIV_GATE_LOGS',
        title: '2. Visitor & Gatekeeper Entry Confidentiality',
        badge: '48-Hour Auto-Purge',
        summary: 'Visitor logs and phone numbers are strictly protected with automated data expiration.',
        details: [
          'When guests, delivery personnel, cab drivers, or maintenance technicians enter the complex, only essential visit metadata is captured (Name, Purpose, Flat Number, Time of Entry).',
          'Masked Phone Numbers: Visitor and resident contact numbers displayed to security personnel on the gate scanner are masked (e.g. 98****432) to prevent unauthorized harassment.',
          '48-Hour Retention Window: Routine visitor session logs are automatically purged from active databases after 48 hours unless flagged for an active security incident.',
          'Digital Visitor Passes created by residents are single-use or window-restricted and expire automatically after the scheduled date and time.',
        ],
        keyHighlights: [
          'All visitor phone numbers masked on guard devices',
          'Automated background deletion of visitor logs after 48 hours',
        ],
        legalReference: 'Model Society Bye-Laws on Security & Visitor Management',
      },
      {
        id: 'PRIV_CCTV',
        title: '3. CCTV Surveillance & Perimeter Security',
        badge: 'Security Only',
        summary: 'Surveillance cameras monitor only common perimeter areas, never private balconies or interiors.',
        details: [
          'CCTV cameras operate 24/7 strictly in common public areas: main gates, driveways, lift lobbies, clubhouse entrance, and perimeter boundaries.',
          'Cameras are strictly forbidden from pointing toward residential apartment interiors, private balconies, or restrooms.',
          'Footage access is restricted to authorized Security Supervisors and Estate Managers. Footage cannot be exported or distributed to public social media groups.',
          'In the event of an investigation or police report, footage requires written authorization from the Society President or Secretary before formal release.',
        ],
        keyHighlights: [
          'No camera coverage of private dwelling spaces or unit doors',
          'Strict audit trail for any footage access requests',
        ],
      },
      {
        id: 'PRIV_WHATSAPP',
        title: '4. WhatsApp Broadcasts & Public Export Privacy',
        badge: 'Export Controls',
        summary: 'Public exports and WhatsApp group reports omit sensitive resident personal contact info.',
        details: [
          'WhatsApp event plans, excursion itineraries, and expense settlement broadcasts only display flat units (e.g. B-204) and organizer names.',
          'Private resident phone numbers, personal bank account numbers, and emergency contacts are excluded from generated WhatsApp broadcast text.',
          'Residents can opt out of having their name displayed in public society pool contribution lists upon written request to the organizer.',
        ],
        keyHighlights: [
          'No personal phone numbers or bank account numbers in WhatsApp exports',
          'Anonymous contribution option available on request',
        ],
      },
      {
        id: 'PRIV_RIGHTS',
        title: '5. Resident Rights, Profile Editing & Account Deletion',
        badge: 'Resident Control',
        summary: 'Residents maintain full control to review, edit, or remove their data upon moving out.',
        details: [
          'Residents have the continuous right to view and update their profile details (Name, Phone, Emergency Contacts, Vehicle Numbers) via the Edit Profile screen.',
          'Upon moving out (tenancy expiration or property transfer), residents may request account archival, which disables active gate passes and de-indexes directory entries within 7 days.',
        ],
        keyHighlights: [
          'Instant profile correction directly in-app',
          'Prompt archival upon move-out with immediate pass revocation',
        ],
      },
    ],
  },
  {
    key: 'PAYMENT',
    title: 'Payment & Billing Policy Guidelines',
    shortTitle: 'Payments',
    icon: 'card',
    tagline: 'Rules governing UPI/GPay payments, maintenance invoicing, late penalties, and pool funding.',
    lastUpdated: 'September 2026',
    clauses: [
      {
        id: 'PAY_UPI_STANDARDS',
        title: '1. NPCI UPI & Google Pay Standards',
        badge: 'NPCI Standard',
        summary: 'All UPI QR codes follow National Payments Corporation of India (NPCI) specifications.',
        details: [
          'Payments made via Google Pay (GPay), PhonePe, Paytm, BHIM, or NetBanking utilize standard UPI intent URIs (upi://pay?pa=...&cu=INR).',
          'Every dynamic QR code generated encodes the society merchant Virtual Payment Address (VPA) and accurate invoice reference numbers (e.g. INV-1).',
          'Zero Payment Surcharge: The society does not levy additional processing surcharges for payments made through standard UPI applications.',
          'Instant Soundbox & Receipt: Verified transactions generate an instant digital receipt (#REC-...) with an immutable transaction hash.',
        ],
        keyHighlights: [
          'Zero processing fee for all resident UPI transfers',
          'NPCI compliance across all QR standees',
        ],
        legalReference: 'Reserve Bank of India (RBI) & NPCI UPI Merchant Guidelines',
      },
      {
        id: 'PAY_MAINTENANCE_CYCLES',
        title: '2. Maintenance Invoicing, Due Dates & Overdue Penalties',
        badge: 'Monthly Billing',
        summary: 'Clear billing schedules, grace periods, and late payment interest calculation.',
        details: [
          'Billing Cycle: Society maintenance invoices are generated on the 1st day of each calendar month covering common area electricity, security, water supply, and upkeep.',
          'Due Date & Grace Period: Invoices are payable on or before the 10th of each month (10-day interest-free grace period).',
          'Overdue Surcharges: Payments received after the due date incur a simple interest late fee of 1.5% per month (or fixed ₹250 late charge as per society general body resolution).',
          'Default & Suspension: Non-payment for more than 60 consecutive days may result in temporary suspension of optional clubhouse/facility booking privileges until outstanding balances are cleared.',
        ],
        keyHighlights: [
          '10-day interest-free grace period every month',
          'Late fee capped as per Society General Body Meeting (GBM) resolution',
        ],
      },
      {
        id: 'PAY_EVENT_POOLS',
        title: '3. Community Event Pools & Voluntary Contributions',
        badge: 'Non-Profit Fund',
        summary: 'Guidelines for festival funds, sports tourneys, and day trip budget sponsorships.',
        details: [
          'Event pools (e.g. Festival celebrations, Heritage day trips, Sports mela) are voluntary community initiatives managed on a non-profit basis.',
          'Residents may participate as general attendees, partners, or sponsors with full transparency on estimated vs. actual incurred expenses.',
          'Surplus Resolution: Any unused funds remaining after event completion will be resolved through: (a) Rollover to the next community event fund, (b) Prorated credit adjustment against next month\'s maintenance invoice, or (c) Community vote.',
          'All pool contributions are logged in the persistent society event ledger and itemized on the WhatsApp event report.',
        ],
        keyHighlights: [
          '100% voluntary participation and contribution',
          'Transparent surplus resolution via credit adjustment or rollover',
        ],
      },
      {
        id: 'PAY_REIMBURSEMENTS',
        title: '4. Purchaser Reimbursements & Fair-Share Calculations',
        badge: 'Split Settlement',
        summary: 'Mathematical formula and audit trail for residents who pay expenses upfront.',
        details: [
          'Fair Share Formula: Per-person share is computed as (Total Incurred Actual Expenses ÷ Number of Confirmed RSVP Attendees).',
          'Reimbursement Due: When an authorized resident purchases supplies, bus rentals, or food upfront on behalf of the group, their net settlement is calculated as: (Total Paid by Purchaser - Their Own Fair Share).',
          'Direct Settlement via UPI: Attendees can scan the purchaser\'s personal UPI QR standee directly within the app to settle dues with instant proof of payment.',
          'Dispute Window: Any discrepancies in logged expense amounts must be raised within 7 calendar days of the event conclusion.',
        ],
        keyHighlights: [
          'Automated, mathematically transparent fair share division',
          'Direct resident-to-resident UPI settle-up with zero intermediary hold',
        ],
      },
      {
        id: 'PAY_REFUNDS_FAILED',
        title: '5. Failed Transactions, Bank Reversals & Dispute Redressal',
        badge: '48-72h Auto-Reversal',
        summary: 'Procedures for handling bank debits when transactions fail to reflect immediately.',
        details: [
          'If funds are debited from your bank account but the invoice status shows PENDING or UNPAID, the banking switch automatically reconciles or reverses the transaction within 48 to 72 business hours.',
          'Residents can tap "Check Status" or provide the UPI UTR / RRN reference number to the society accounts office for manual validation.',
          'Facility booking payments for cancelled bookings are credited back or reopened according to the Facility Cancellation Rules.',
        ],
        keyHighlights: [
          'RBI T+1 / T+2 auto-reversal timeline for failed bank debits',
          'Receipt numbers and UTR tracking for dispute resolution',
        ],
      },
    ],
  },
  {
    key: 'TERMS',
    title: 'Society Terms of Service & Code of Conduct',
    shortTitle: 'Terms of Service',
    icon: 'document-text',
    tagline: 'Standard rules of residency, amenity usage, community discussions, and bylaws.',
    lastUpdated: 'September 2026',
    clauses: [
      {
        id: 'TOS_ELIGIBILITY',
        title: '1. App Eligibility, Role Verification & Tenancy Status',
        badge: 'Verified Access',
        summary: 'Access to the AMA platform is restricted to verified residents, owners, tenants, and staff.',
        details: [
          'Registration requires verification against the society flat allotment master record.',
          'Tenants must provide active rental agreement details approved by the unit owner or estate management.',
          'Accounts are strictly non-transferable. Subletting or sharing credentials with external unauthorized individuals is prohibited.',
          'Security guard logins are locked to authorized guard roster hours and gate terminal locations.',
        ],
        keyHighlights: [
          'Mandatory verification against society flat registry',
          'Separate, role-based access for Owners, Tenants, and Security Staff',
        ],
      },
      {
        id: 'TOS_FACILITIES',
        title: '2. Community Facility Booking, Quiet Hours & Cancellation',
        badge: 'Fair Sharing',
        summary: 'Rules for clubhouse, swimming pool, tennis courts, and party halls.',
        details: [
          'Advance Booking Window: Residents may book clubhouse halls or sports courts up to 30 days in advance.',
          'Past Time Slot Prevention: Bookings cannot be requested for historical or past time slots on the current date.',
          'Cancellation & Reopening: If a resident cancels a booking, the reserved slot immediately reopens for other residents with a green "Reopened" status tag.',
          'Quiet Hours: Amplified sound, loud music, and outdoor party noise must cease promptly by 10:00 PM in accordance with local municipal noise regulations.',
          'Cleanliness: Residents booking community halls are responsible for ensuring catering debris is cleared within 2 hours of event conclusion.',
        ],
        keyHighlights: [
          'Quiet hours strictly enforced from 10:00 PM to 06:00 AM',
          'Instant slot reopening ensures high amenity availability',
        ],
      },
      {
        id: 'TOS_CONDUCT',
        title: '3. Community News, Bulletins & Discussion Code of Conduct',
        badge: 'Zero Tolerance',
        summary: 'Guidelines for respectful interaction on noticeboards and threaded discussions.',
        details: [
          'The community news feed and discussion threads are designated for constructive property maintenance discussions, alerts, and community announcements.',
          'Strictly Prohibited: Harassment, hate speech, religious or political campaigning, personal defamation, commercial advertising spam, or abusive language.',
          'Moderation: The RWA Managing Committee reserves the right to hide non-compliant comments or temporarily suspend posting privileges for repeated violations.',
        ],
        keyHighlights: [
          'Civic, respectful discourse mandatory on all public feeds',
          'No commercial solicitation or political campaigning permitted',
        ],
      },
      {
        id: 'TOS_GUEST_LIABILITY',
        title: '4. Host Liability for Visitors & Domestic Staff',
        badge: 'Host Responsibility',
        summary: 'Residents are responsible for the conduct of individuals admitted under their pass.',
        details: [
          'Residents issuing Visitor Passes or Guest PINs are deemed the primary host responsible for their guest\'s compliance with society parking and security rules.',
          'Visitors must park strictly in designated Visitor Parking bays and not obstruct resident stilt slots or emergency fire tender driveways.',
          'Delivery drivers and cab aggregators must observe the campus speed limit of 15 km/h.',
        ],
        keyHighlights: [
          'Speed limit: 15 km/h across all internal society roads',
          'Visitor parking strictly in marked bays',
        ],
      },
      {
        id: 'TOS_DISCLAIMER',
        title: '5. Disclaimers & Limitation of Liability',
        badge: 'Legal Disclaimer',
        summary: 'Operational responsibilities of the Society Managing Committee and platform.',
        details: [
          'The AMA platform is a management support tool. The Resident Welfare Association (RWA) and software developers are not liable for municipal power/water grid failures or natural force majeure events.',
          'Emergency contact features provided in the app complement, but do not replace, direct calls to emergency public services (Police: 100/112, Fire: 101, Ambulance: 102/108).',
        ],
        keyHighlights: [
          'App assists emergency coordination; direct public emergency calls take priority',
        ],
      },
    ],
  },
  {
    key: 'SECURITY',
    title: 'Gate Security & Visitor Pass Guidelines',
    shortTitle: 'Gate Security',
    icon: 'lock-closed',
    tagline: 'Protocols for entry gate verification, vehicle checking, and emergency access.',
    lastUpdated: 'September 2026',
    clauses: [
      {
        id: 'SEC_PASS_TIMINGS',
        title: '1. Strict Day & Time Window Enforcement',
        badge: 'Live Gate Check',
        summary: 'Visitor passes are valid only within approved dates and timing windows.',
        details: [
          'Gatekeepers scan digital QR passes to verify that the entry attempt falls within the resident\'s allowed window (e.g. Afternoon 02:00 PM - 06:00 PM).',
          'Passes scanned before the designated start time or after the end time trigger a red DENIED alert on the guard terminal.',
          'Once a one-time visitor pass is admitted, its status changes to USED to prevent multi-entry replay.',
        ],
        keyHighlights: [
          'Strict timing validation prevents unauthorized after-hours entry',
        ],
      },
      {
        id: 'SEC_DYNAMIC_TOKEN',
        title: '2. Dynamic QR Tokens & Anti-Screenshot Replay',
        badge: 'Cryptographic Token',
        summary: 'Resident passes feature cryptographic timestamp refresh to stop pass sharing.',
        details: [
          'Resident ID passes encode timestamped cryptographic tokens that refresh on demand.',
          'Static screenshots of old passes are rejected by the guard scanner once expired.',
          'Residents should use the "+ Issue Visitor Pass" feature for guests rather than sharing screenshots of their personal resident ID.',
        ],
        keyHighlights: [
          'One-tap "Refresh QR" generates a fresh security pass token',
        ],
      },
      {
        id: 'SEC_EMERGENCY',
        title: '3. Emergency & Essential Services Priority Protocol',
        badge: '24/7 Priority',
        summary: 'Unconditional immediate gate access for medical, fire, and police personnel.',
        details: [
          'Ambulances, fire tenders, police vehicles, and emergency medical personnel have unconditional, immediate gate clearance without requiring resident OTP verification.',
          'Guards log the flat destination immediately and raise an automated campus security alert to clear common pathways.',
        ],
        keyHighlights: [
          'Zero delay for ambulances, fire engines, and police personnel',
        ],
      },
      {
        id: 'SEC_TRANSIT_CABS',
        title: '4. Cab, Auto & Delivery Transit Window',
        badge: '15-Min Auto-Checkout',
        summary: 'Automated monitoring of app-based cabs and delivery services.',
        details: [
          'Transit vehicles (Ola, Uber, Quick Cabs) and food/courier deliveries are granted a 15-minute campus transit window upon gate entry.',
          'Guards monitor vehicles exceeding the transit window to ensure campus safety and parking availability.',
        ],
        keyHighlights: [
          '15-minute standard transit limit for drop-offs and deliveries',
        ],
      },
    ],
  },
];
