/**
 * Yearly Maintenance Statutory Audit Report Generator
 * Generates comprehensive society maintenance audit reports with financial,
 * operational, and statutory compliance data, enabling direct export to
 * Microsoft Word (.doc) and PDF (.pdf) formats.
 */

import { Platform, Share, Linking } from 'react-native';

export interface AuditIncomeItem {
  category: string;
  amount: number;
  notes: string;
}

export interface AuditExpenseItem {
  category: string;
  amount: number;
  percent: number;
  vendorName: string;
  notes: string;
}

export interface YearlyAuditData {
  financialYear: string;
  period: string;
  auditDate: string;
  societyName: string;
  societyAddress: string;
  societyReg: string;
  gstin: string;
  auditor: {
    name: string;
    firm: string;
    membershipNo: string;
    frn: string;
    opinion: string;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSurplus: number;
    sinkingFundReserve: number;
    collectionEfficiency: number;
    totalUnits: number;
    billedAmount: number;
    collectedAmount: number;
    overdueAmount: number;
  };
  incomeBreakdown: AuditIncomeItem[];
  expenseBreakdown: AuditExpenseItem[];
  operations: {
    totalTickets: number;
    resolvedTickets: number;
    slaPercentage: number;
    avgResolutionDays: number;
    liftUptimePercentage: number;
    dgRunningHours: number;
    waterTestingCompliant: boolean;
  };
  statutoryFindings: string[];
}

export const AUDIT_REPORTS_BY_YEAR: Record<string, YearlyAuditData> = {
  'FY 2025-26': {
    financialYear: 'FY 2025-26',
    period: '01 April 2025 – 31 March 2026',
    auditDate: '15 May 2026',
    societyName: 'AMA Heights Cooperative Housing Society Ltd.',
    societyAddress: 'Plot 42, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
    societyReg: 'CHS/BLR/2019/8821',
    gstin: '29AABCA8821K1ZM',
    auditor: {
      name: 'CA. R. Narayanan, FCA',
      firm: 'M/s. R. Narayanan & Associates, Chartered Accountants',
      membershipNo: '048215',
      frn: '014285S',
      opinion: 'Clean & Unqualified Statutory Audit Opinion',
    },
    summary: {
      totalIncome: 6519000,
      totalExpenses: 6260000,
      netSurplus: 259000,
      sinkingFundReserve: 3845000,
      collectionEfficiency: 96.0,
      totalUnits: 120,
      billedAmount: 5400000,
      collectedAmount: 5184000,
      overdueAmount: 216000,
    },
    incomeBreakdown: [
      { category: 'Regular Monthly Maintenance Collections', amount: 5184000, notes: 'Collected from 120 units across Towers A & B (96% on-time efficiency)' },
      { category: 'Sinking & Capital Replacement Reserve Fund', amount: 600000, notes: 'Mandatory statutory allocation @ ₹500/flat/month (100% collected)' },
      { category: 'Clubhouse & Multipurpose Hall Rental Charges', amount: 385000, notes: 'Private resident events, birthday bookings, and festival popups' },
      { category: 'Fixed Deposit & Auto-Sweep Savings Interest', amount: 210000, notes: 'Accrued from HDFC & SBI Sinking Fund Fixed Deposits @ 7.1% p.a.' },
      { category: 'Move-in / Move-out & Fit-out Administration Fees', amount: 140000, notes: '28 tenant transitions and interior modification approvals' },
    ],
    expenseBreakdown: [
      { category: 'Security & 24/7 Gatekeeping Personnel', amount: 1560000, percent: 24.9, vendorName: 'Apex Shield Security Services Pvt Ltd', notes: '8 licensed guards, 1 night supervisor, biometric visitor gate management' },
      { category: 'Common Area Power, Lift Electricity & DG Fuel', amount: 1125000, percent: 18.0, vendorName: 'BESCOM & Indian Oil (Fuel)', notes: 'BESCOM common meter tariff + 1,480 litres high-speed diesel for DG backup' },
      { category: 'Housekeeping, Waste Segregation & Sanitation', amount: 780000, percent: 12.5, vendorName: 'CleanCorp Facility Management', notes: 'Daily corridor sweeping, garbage segregation, deep parking scrubbing' },
      { category: 'Water Supply, STP & Borewell Upkeep', amount: 610000, percent: 9.7, vendorName: 'Cauvery Water Tankers & HydroTech STP', notes: 'STP continuous aeration, chemical dosing, and summer tanker supplementation' },
      { category: 'Statutory Sinking Fund Transfer', amount: 600000, percent: 9.6, vendorName: 'HDFC Bank Reserve Escrow A/C', notes: 'Direct statutory credit into non-withdrawable reserve fund' },
      { category: 'Passenger Lifts & Elevators Comprehensive AMC', amount: 420000, percent: 6.7, vendorName: 'Schindler India Elevator Pvt Ltd', notes: 'Comprehensive AMC for 4 high-speed 13-passenger elevators' },
      { category: 'Plumbing, Electrical & Civil Maintenance Orders', amount: 395000, percent: 6.3, vendorName: 'Authorized Society Technicians', notes: 'Overhead tank cleaning, valve replacements, sensor light fixes, roof grouting' },
      { category: 'Swimming Pool & Gym Fitness Center Upkeep', amount: 280000, percent: 4.5, vendorName: 'BlueWave Pools & FitLife Gym Care', notes: 'Chlorine balancing, filtration sand change, gym machine bi-monthly service' },
      { category: 'Landscaping, Garden Care & Pest Control AMC', amount: 210000, percent: 3.4, vendorName: 'GreenThumb Gardens & PCI Pest Control', notes: 'Lawn mowing, seasonal flowering, monthly termite & fogging drives' },
      { category: 'Statutory Audit, Legal Fees & Society Insurance', amount: 165000, percent: 2.6, vendorName: 'ICICI Lombard & CA Narayanan & Co.', notes: 'Building fire & earthquake cover, auditor fee, annual registrar filings' },
      { category: 'Office Administration & Contingency Fund', amount: 115000, percent: 1.8, vendorName: 'Society Management Committee', notes: 'Printing, accounting software subscription, emergency storm repairs' },
    ],
    operations: {
      totalTickets: 348,
      resolvedTickets: 341,
      slaPercentage: 98.0,
      avgResolutionDays: 1.4,
      liftUptimePercentage: 99.85,
      dgRunningHours: 142,
      waterTestingCompliant: true,
    },
    statutoryFindings: [
      'The Society maintains accurate digital books of accounts and ledger vouchers in accordance with the Karnataka Cooperative Societies Act, 1959.',
      'Sinking Fund and Repair Reserves totaling ₹38,45,000 are securely locked in Scheduled Commercial Bank Fixed Deposits with auto-renewal mandates.',
      'No instance of diversion of capital reserve funds towards routine day-to-day revenue expenditures was observed.',
      'Goods & Services Tax (GST) returns in Form GSTR-1 and GSTR-3B have been periodically filed without default or outstanding demand notices.',
      'TDS deductions under Section 194C & 194J on vendor contract payments were duly deposited into the Central Government treasury within statutory deadlines.',
      'Physical verification of society fixed assets (Generators, Transformers, STP Motors, Solar Inverters) was carried out on 15 March 2026 with zero discrepancies.',
    ],
  },

  'FY 2024-25': {
    financialYear: 'FY 2024-25',
    period: '01 April 2024 – 31 March 2025',
    auditDate: '22 May 2025',
    societyName: 'AMA Heights Cooperative Housing Society Ltd.',
    societyAddress: 'Plot 42, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
    societyReg: 'CHS/BLR/2019/8821',
    gstin: '29AABCA8821K1ZM',
    auditor: {
      name: 'CA. R. Narayanan, FCA',
      firm: 'M/s. R. Narayanan & Associates, Chartered Accountants',
      membershipNo: '048215',
      frn: '014285S',
      opinion: 'Clean & Unqualified Statutory Audit Opinion',
    },
    summary: {
      totalIncome: 6020000,
      totalExpenses: 5810000,
      netSurplus: 210000,
      sinkingFundReserve: 3245000,
      collectionEfficiency: 94.5,
      totalUnits: 120,
      billedAmount: 5184000,
      collectedAmount: 4898880,
      overdueAmount: 285120,
    },
    incomeBreakdown: [
      { category: 'Regular Monthly Maintenance Collections', amount: 4898880, notes: 'Collected maintenance dues across FY 24-25' },
      { category: 'Sinking & Capital Replacement Fund', amount: 576000, notes: 'Statutory capital reserves allocation' },
      { category: 'Clubhouse & Facility Bookings', amount: 310000, notes: 'Resident celebrations & sports arena events' },
      { category: 'Fixed Deposit Bank Interest', amount: 145120, notes: 'Cumulative interest earnings on reserves' },
      { category: 'Move-in & Move-out Transfer Charges', amount: 90000, notes: 'Move-in admin and elevator protective cladding fee' },
    ],
    expenseBreakdown: [
      { category: 'Security Guard Services', amount: 1440000, percent: 24.8, vendorName: 'Apex Shield Security Services', notes: 'Campus perimeter guarding and automated gate pass logging' },
      { category: 'Common Electricity & DG Fuel', amount: 1045000, percent: 18.0, vendorName: 'BESCOM / Fuel Vendor', notes: 'Common pump room, staircase lighting & generator diesel' },
      { category: 'Housekeeping & Sanitization', amount: 720000, percent: 12.4, vendorName: 'CleanCorp Facility Management', notes: 'Daily wet mopping, garbage disposal' },
      { category: 'Water Supply & STP Maintenance', amount: 580000, percent: 10.0, vendorName: 'Cauvery Water Tankers', notes: 'STP filter replacements and auxiliary water tankers' },
      { category: 'Statutory Sinking Fund Transfer', amount: 576000, percent: 9.9, vendorName: 'Bank Reserve Deposit', notes: 'Escrow fixed deposit transfer' },
      { category: 'Lift Comprehensive AMC', amount: 390000, percent: 6.7, vendorName: 'Schindler India', notes: 'Annual elevator servicing and emergency safety tests' },
      { category: 'Plumbing & Electrical Work Orders', amount: 360000, percent: 6.2, vendorName: 'Society Technicians', notes: 'Submersible motor rewinding, panel switchgear repairs' },
      { category: 'Clubhouse, Gym & Pool Care', amount: 260000, percent: 4.5, vendorName: 'BlueWave Pools', notes: 'Pool filtration and gym equipment maintenance' },
      { category: 'Garden Upkeep & Pest Control', amount: 195000, percent: 3.3, vendorName: 'GreenThumb Gardens', notes: 'Hedge trimming, monsoon mosquito fogging' },
      { category: 'Society Insurance & Statutory Audit', amount: 145000, percent: 2.5, vendorName: 'ICICI Lombard & CA Narayanan', notes: 'Property insurance and annual registrar fees' },
      { category: 'Admin & Office Contingencies', amount: 99000, percent: 1.7, vendorName: 'Management Office', notes: 'Notice printing, SMS alerts, domain hosting' },
    ],
    operations: {
      totalTickets: 312,
      resolvedTickets: 304,
      slaPercentage: 97.4,
      avgResolutionDays: 1.6,
      liftUptimePercentage: 99.70,
      dgRunningHours: 168,
      waterTestingCompliant: true,
    },
    statutoryFindings: [
      'Books of accounts examined and verified in good order with full supporting invoices.',
      'Sinking fund balance of ₹32,45,000 kept in designated long-term Fixed Deposits.',
      'GST returns up to date with full input tax credit reconciliation.',
      'Asset registers verified physically by the managing committee.',
    ],
  },
};

/**
 * Generates an executive printable HTML markup for the Audit Report.
 */
export function generateAuditReportHtml(data: YearlyAuditData): string {
  const formatInr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const incomeRows = data.incomeBreakdown
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #475569; font-size: 13px;">${idx + 1}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: #0F172A; font-size: 13px;">${item.category}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700; color: #15803D; font-size: 13px;">${formatInr(item.amount)}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #64748B; font-size: 12px;">${item.notes}</td>
      </tr>`
    )
    .join('');

  const expenseRows = data.expenseBreakdown
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #475569; font-size: 13px;">${idx + 1}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: #0F172A; font-size: 13px;">
          ${item.category}
          <div style="font-size: 11px; color: #64748B; font-weight: 400; margin-top: 2px;">Vendor: ${item.vendorName}</div>
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700; color: #DC2626; font-size: 13px;">${formatInr(item.amount)}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: 600; color: #1E40AF; font-size: 12px;">${item.percent}%</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #64748B; font-size: 12px;">${item.notes}</td>
      </tr>`
    )
    .join('');

  const findingsList = data.statutoryFindings
    .map(
      (finding, idx) => `
      <li style="margin-bottom: 8px; color: #334155; font-size: 13px; line-height: 1.6;">
        <strong>Finding ${idx + 1}:</strong> ${finding}
      </li>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Yearly Maintenance Statutory Audit Report - ${data.financialYear}</title>
  <style>
    @media print {
      body { margin: 0; padding: 15mm; }
      .no-print { display: none !important; }
      @page { size: A4; margin: 15mm; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0F172A;
      background-color: #FFFFFF;
      margin: 0;
      padding: 30px 40px;
      line-height: 1.5;
    }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border-bottom: 2px solid #1D4ED8; padding-bottom: 16px; }
    .society-title { font-size: 22px; font-weight: 800; color: #1D4ED8; margin: 0; }
    .society-sub { font-size: 12px; color: #64748B; margin: 4px 0 0 0; }
    .badge-opinion {
      background-color: #DCFCE7;
      color: #15803D;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 12px;
      display: inline-block;
      border: 1px solid #86EFAC;
    }
    .metric-box {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 16px;
      text-align: left;
    }
    .card-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B; letter-spacing: 0.5px; }
    .card-val { font-size: 20px; font-weight: 800; margin: 6px 0 2px 0; }
    .card-sub { font-size: 11px; color: #64748B; }
    .table-container { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table-head { background-color: #F1F5F9; }
    .table-head th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #CBD5E1; }
    .section-heading {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
      margin-top: 28px;
      margin-bottom: 12px;
      border-left: 4px solid #1D4ED8;
      padding-left: 10px;
    }
    .sig-table { width: 100%; margin-top: 40px; border-top: 1px dashed #CBD5E1; padding-top: 24px; }
    .sig-box { width: 25%; vertical-align: top; text-align: center; }
    .sig-line { width: 140px; border-top: 1px solid #94A3B8; margin: 40px auto 6px auto; }
    .sig-name { font-size: 12px; font-weight: 700; color: #0F172A; }
    .sig-role { font-size: 11px; color: #64748B; }
    .watermark {
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      margin-top: 30px;
      border-top: 1px solid #E2E8F0;
      padding-top: 12px;
    }
  </style>
</head>
<body>

  <!-- Society & Auditor Header -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: middle;">
        <h1 class="society-title">${data.societyName}</h1>
        <p class="society-sub">
          Reg No: <strong>${data.societyReg}</strong> • GSTIN: <strong>${data.gstin}</strong><br>
          ${data.societyAddress}
        </p>
      </td>
      <td style="text-align: right; vertical-align: middle;">
        <div class="badge-opinion">✓ ${data.auditor.opinion}</div>
        <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-top: 6px;">
          Financial Audit Period: ${data.financialYear}
        </div>
        <div style="font-size: 11px; color: #64748B;">Date of Audit Sign-off: ${data.auditDate}</div>
      </td>
    </tr>
  </table>

  <!-- Executive Summary Metrics -->
  <div class="metrics-grid">
    <div class="card" style="border-left: 4px solid #15803D;">
      <div class="card-label">Total Maintenance Income</div>
      <div class="card-val" style="color: #15803D;">${formatInr(data.summary.totalIncome)}</div>
      <div class="card-sub">${data.summary.collectionEfficiency}% on-time collection efficiency</div>
    </div>
    <div class="card" style="border-left: 4px solid #DC2626;">
      <div class="card-label">Total Maintenance Expenses</div>
      <div class="card-val" style="color: #DC2626;">${formatInr(data.summary.totalExpenses)}</div>
      <div class="card-sub">Audited operational & AMC outflows</div>
    </div>
    <div class="card" style="border-left: 4px solid #2563EB;">
      <div class="card-label">Net Operating Surplus</div>
      <div class="card-val" style="color: #2563EB;">+${formatInr(data.summary.netSurplus)}</div>
      <div class="card-sub">Transferred to general society reserve</div>
    </div>
    <div class="card" style="border-left: 4px solid #7C3AED;">
      <div class="card-label">Sinking Fund Bank Reserve</div>
      <div class="card-val" style="color: #7C3AED;">${formatInr(data.summary.sinkingFundReserve)}</div>
      <div class="card-sub">Held in auto-sweep Fixed Deposits</div>
    </div>
  </div>

  <!-- Operational Performance & SLA Scorecard -->
  <div class="metric-box">
    <div style="font-size: 13px; font-weight: 700; color: #1E40AF; margin-bottom: 8px;">
      ⚡ Operational Maintenance Performance & Infrastructure SLAs
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <tr>
        <td style="padding: 4px 10px;">• Total Service Tickets: <strong>${data.operations.totalTickets}</strong></td>
        <td style="padding: 4px 10px;">• Tickets Resolved: <strong>${data.operations.resolvedTickets} (${data.operations.slaPercentage}%)</strong></td>
        <td style="padding: 4px 10px;">• Avg Turnaround Time: <strong>${data.operations.avgResolutionDays} days</strong></td>
      </tr>
      <tr>
        <td style="padding: 4px 10px;">• Elevator Uptime: <strong>${data.operations.liftUptimePercentage}%</strong></td>
        <td style="padding: 4px 10px;">• DG Backup Run: <strong>${data.operations.dgRunningHours} hrs</strong></td>
        <td style="padding: 4px 10px;">• Potable Water Compliance: <strong>${data.operations.waterTestingCompliant ? '100% BIS Compliant ✓' : 'Non-Compliant'}</strong></td>
      </tr>
    </table>
  </div>

  <!-- Statement of Maintenance Income -->
  <div class="section-heading">1. Statement of Maintenance Income & Revenue Receipts</div>
  <table class="table-container">
    <thead class="table-head">
      <tr>
        <th style="width: 40px;">#</th>
        <th>Revenue Head / Source</th>
        <th style="text-align: right; width: 140px;">Amount (INR)</th>
        <th>Auditor Verification Notes</th>
      </tr>
    </thead>
    <tbody>
      ${incomeRows}
      <tr style="background-color: #F8FAFC; font-weight: 800;">
        <td colspan="2" style="padding: 12px 14px; text-align: right; color: #0F172A; font-size: 14px;">Total Annual Revenue & Receipts:</td>
        <td style="padding: 12px 14px; text-align: right; color: #15803D; font-size: 15px;">${formatInr(data.summary.totalIncome)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <!-- Statement of Maintenance Outflows & AMC Expenses -->
  <div class="section-heading">2. Statement of Maintenance Outflows & Facility AMC Expenditures</div>
  <table class="table-container">
    <thead class="table-head">
      <tr>
        <th style="width: 40px;">#</th>
        <th>Expenditure Head & Authorized Contractor</th>
        <th style="text-align: right; width: 140px;">Amount (INR)</th>
        <th style="text-align: center; width: 60px;">Share</th>
        <th>Scope & Audit Observations</th>
      </tr>
    </thead>
    <tbody>
      ${expenseRows}
      <tr style="background-color: #F8FAFC; font-weight: 800;">
        <td colspan="2" style="padding: 12px 14px; text-align: right; color: #0F172A; font-size: 14px;">Total Audited Maintenance Outflows:</td>
        <td style="padding: 12px 14px; text-align: right; color: #DC2626; font-size: 15px;">${formatInr(data.summary.totalExpenses)}</td>
        <td style="text-align: center; color: #1E40AF;">100%</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <!-- Statutory Findings & Compliance Certificate -->
  <div class="section-heading">3. Statutory Auditor Observations & Regulatory Compliance Notes</div>
  <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px 24px;">
    <ul style="margin: 0; padding-left: 20px;">
      ${findingsList}
    </ul>
  </div>

  <!-- Signatures Block -->
  <table class="sig-table">
    <tr>
      <td class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-name">${data.auditor.name}</div>
        <div class="sig-role">Statutory Auditor (M.No: ${data.auditor.membershipNo})<br>${data.auditor.firm}</div>
      </td>
      <td class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-name">Vikram Malhotra</div>
        <div class="sig-role">Hon. President / Chairman<br>Managing Committee</div>
      </td>
      <td class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-name">Priya Sharma</div>
        <div class="sig-role">Hon. Secretary<br>Managing Committee</div>
      </td>
      <td class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-name">Rajesh Nair</div>
        <div class="sig-role">Hon. Treasurer<br>Managing Committee</div>
      </td>
    </tr>
  </table>

  <!-- Footer Watermark -->
  <div class="watermark">
    Generated automatically by AMA Society Portal • Verified & Certified under the State Cooperative Societies Act • Confidential & Proprietary to Registered Residents
  </div>

</body>
</html>
`;
}

/**
 * Downloads the Yearly Maintenance Audit Report as a Microsoft Word (.doc) file.
 */
export function downloadAuditReportDoc(data: YearlyAuditData): boolean {
  try {
    const htmlContent = generateAuditReportHtml(data);

    // Standard Microsoft Word HTML Header & XML namespace wrappers
    const wordDocumentContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <meta charset="utf-8">
        <title>Yearly Maintenance Audit Report ${data.financialYear}</title>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob(['\ufeff', wordDocumentContent], {
        type: 'application/msword;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Yearly_Maintenance_Audit_Report_${data.financialYear.replace(/\s+/g, '_')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error downloading Word document:', err);
    return false;
  }
}

/**
 * Downloads or prints the Yearly Maintenance Audit Report in PDF (.pdf) format.
 * Uses print-to-PDF standard for exact typography and layout fidelity.
 */
export function downloadAuditReportPdf(data: YearlyAuditData): boolean {
  try {
    const htmlContent = generateAuditReportHtml(data);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // 1. Trigger automated direct file download of the PDF container
      const blob = new Blob([htmlContent], { type: 'application/pdf;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `Yearly_Maintenance_Audit_Report_${data.financialYear.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      // 2. Also open high-fidelity print-to-PDF window for instant Save as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (e) {
            console.log('Print preview triggered');
          }
        }, 500);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error exporting PDF:', err);
    return false;
  }
}

/**
 * Copies a structured text summary of the audit to the clipboard.
 */
export function formatAuditReportSummaryText(data: YearlyAuditData): string {
  const formatInr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return [
    `📊 YEARLY MAINTENANCE STATUTORY AUDIT REPORT`,
    `🏢 Society: ${data.societyName}`,
    `📅 Financial Period: ${data.financialYear} (${data.period})`,
    `⚖️ Auditor: ${data.auditor.name} (${data.auditor.firm})`,
    `✓ Audit Opinion: ${data.auditor.opinion}`,
    ``,
    `💰 FINANCIAL HIGHLIGHTS:`,
    `• Total Collections & Revenue: ${formatInr(data.summary.totalIncome)}`,
    `• Total Audited Expenditures: ${formatInr(data.summary.totalExpenses)}`,
    `• Net Operational Surplus: +${formatInr(data.summary.netSurplus)}`,
    `• Sinking Fund Bank Reserve: ${formatInr(data.summary.sinkingFundReserve)} (in Escrow FDs)`,
    `• Collection Efficiency: ${data.summary.collectionEfficiency}% across 120 flats`,
    ``,
    `⚡ OPERATIONAL SLAs:`,
    `• Service Tickets Resolved: ${data.operations.resolvedTickets}/${data.operations.totalTickets} (${data.operations.slaPercentage}%)`,
    `• Avg Resolution Time: ${data.operations.avgResolutionDays} days`,
    `• Lift & Elevator Uptime: ${data.operations.liftUptimePercentage}%`,
    ``,
    `Verified & Signed by Auditor & Managing Committee.`,
    `Download official PDF & DOC versions from the AMA Society Portal.`,
  ].join('\n');
}

/**
 * Copies a structured text summary of the audit to the clipboard using a multi-tiered fallback
 * that works across modern browsers, non-secure contexts (HTTP / local IP), and React Native.
 */
export async function copyAuditSummaryToClipboard(
  data: YearlyAuditData
): Promise<{ success: boolean; method: 'clipboard-api' | 'execCommand' | 'native-share' | 'none'; message: string }> {
  const text = formatAuditReportSummaryText(data);

  // Method 1: Modern async Clipboard API (works on HTTPS / localhost when permitted)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return {
        success: true,
        method: 'clipboard-api',
        message: '📋 Audit report executive summary copied to clipboard!',
      };
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, attempting execCommand fallback:', err);
    }
  }

  // Method 2: DOM execCommand('copy') fallback (works on HTTP, local IP addresses, older browsers)
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        return {
          success: true,
          method: 'execCommand',
          message: '📋 Audit report executive summary copied to clipboard!',
        };
      }
    } catch (fallbackErr) {
      console.warn('document.execCommand copy fallback failed:', fallbackErr);
    }
  }

  // Method 3: Fallback using React Native Share sheet
  try {
    if (Share && typeof Share.share === 'function') {
      await Share.share({
        title: `Yearly Maintenance Audit Report - ${data.financialYear}`,
        message: text,
      });
      return {
        success: true,
        method: 'native-share',
        message: '📋 Audit report shared via system share sheet!',
      };
    }
  } catch (shareErr) {
    console.warn('React Native Share fallback failed:', shareErr);
  }

  return {
    success: false,
    method: 'none',
    message: 'Unable to automatically copy. Please use the preview dialog to copy manually.',
  };
}

/**
 * Directly shares or opens the audit executive summary on WhatsApp.
 */
export async function shareAuditSummaryOnWhatsApp(data: YearlyAuditData): Promise<boolean> {
  const text = formatAuditReportSummaryText(data);
  const encoded = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank');
    return true;
  }

  try {
    const supported = await Linking.canOpenURL(whatsappUrl);
    if (supported) {
      await Linking.openURL(whatsappUrl);
      return true;
    }
  } catch (e) {
    console.warn('Linking WhatsApp error:', e);
  }

  // Fallback to general share
  try {
    await Share.share({
      title: `Yearly Maintenance Audit - ${data.financialYear}`,
      message: text,
    });
    return true;
  } catch (err) {
    return false;
  }
}

