/**
 * exportUtils.js
 * Browser-native CSV and print-based PDF exports — no external dependencies.
 */

/**
 * Trigger a CSV file download in the browser.
 * @param {string[][]} rows - 2D array where first row is headers.
 * @param {string} filename - Name of the downloaded file (without extension).
 */
export function downloadCSV(rows, filename) {
  const escape = (val) => {
    const str = String(val ?? '')
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str
  }

  const csv = rows.map(row => row.map(escape).join(',')).join('\n')
  const bom = '\uFEFF' // UTF-8 BOM — ensures Excel opens with correct encoding

  // Build a safe filename: only word chars and hyphens, always ends in .csv
  const safeName = (filename || 'report')
    .replace(/[\s—–]+/g, '_')   // spaces & em-dashes → underscore
    .replace(/[^\w-]/g, '')     // strip everything else
    .replace(/_+/g, '_')         // collapse multiple underscores
    .replace(/^\_|\_$/g, '')    // trim leading/trailing underscores
  const finalName = safeName ? `${safeName}.csv` : 'report.csv'

  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', finalName)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()

  // Delay revocation so the browser has time to initiate the download
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 250)
}

/**
 * Open a browser print dialog with a premium formatted report.
 * @param {string} title - Report title shown at top of the print page.
 * @param {string[][]} rows - 2D array where first row is headers.
 * @param {Object} [meta] - Optional meta: { restaurantName, period, subtitle }
 */
export function printToPDF(title, rows, meta = {}) {
  const headers  = rows[0] || []
  const dataRows = rows.slice(1)
  const now      = new Date()
  const dateStr  = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr  = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  const restName  = meta.restaurantName || 'RestroAI Business'
  const subtitle  = meta.subtitle || 'Business Intelligence Report'
  const period    = meta.period    || 'Last 30 Days'
  const totalRows = dataRows.filter(r => r[0] && r[0] !== '').length

  // Separate TOTAL footer row from data
  const bodyRows  = dataRows.filter(r => !String(r[0]).startsWith('TOTAL') && r[0] !== '')
  const totalRow  = dataRows.find(r => String(r[0]).startsWith('TOTAL'))

  const tableBody = bodyRows.map((row, i) =>
    `<tr class="${i % 2 === 0 ? 'even' : ''}">
       ${row.map((cell, ci) => `<td class="${ci > 0 ? 'num' : ''}">${cell ?? ''}</td>`).join('')}
     </tr>`
  ).join('')

  const totalFooter = totalRow
    ? `<tfoot><tr>${totalRow.map((cell, ci) =>
        `<td class="${ci > 0 ? 'num' : ''}">${cell ?? ''}</td>`
      ).join('')}</tr></tfoot>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 12px;
      color: #1e293b;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page wrapper ── */
    .page { max-width: 900px; margin: 0 auto; padding: 40px 48px 60px; }

    /* ── Header banner ── */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 24px;
      border-bottom: 2px solid #ede9fe;
      margin-bottom: 28px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-mark {
      width: 42px; height: 42px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      font-size: 18px; font-weight: 900;
      letter-spacing: -1px;
    }
    .brand-name  { font-size: 18px; font-weight: 800; color: #1e293b; line-height: 1.1; }
    .brand-tagline { font-size: 10px; color: #94a3b8; font-weight: 500; margin-top: 2px; }
    .header-meta { text-align: right; }
    .header-meta .doc-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #7c3aed; text-transform: uppercase; }
    .header-meta .doc-date  { font-size: 11px; color: #64748b; margin-top: 2px; }

    /* ── Title bar ── */
    .title-bar {
      background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
      border-radius: 14px;
      padding: 22px 28px;
      margin-bottom: 24px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .title-bar h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .title-bar .subtitle { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 4px; font-weight: 500; }
    .badge {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 20px;
      padding: 6px 16px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    /* ── Summary strip ── */
    .summary-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .summary-card .label { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; color: #94a3b8; text-transform: uppercase; }
    .summary-card .value { font-size: 17px; font-weight: 800; color: #1e293b; margin-top: 3px; }

    /* ── Section heading ── */
    .section-heading {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #7c3aed;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-heading::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #ede9fe;
    }

    /* ── Data table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    thead tr {
      background: #1e293b;
    }
    thead th {
      padding: 10px 14px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #94a3b8;
    }
    thead th.num { text-align: right; }

    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr.even td { background: #f8fafc; }
    tbody tr:hover td { background: #f8f7ff; }

    td {
      padding: 9px 14px;
      font-size: 11px;
      color: #374151;
      font-weight: 500;
    }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td:first-child { color: #1e293b; font-weight: 600; }

    tfoot tr { background: #ede9fe !important; }
    tfoot td {
      padding: 11px 14px;
      font-size: 11px;
      font-weight: 800;
      color: #4c1d95;
      border-top: 2px solid #c4b5fd;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #94a3b8;
      font-weight: 500;
    }
    .footer strong { color: #7c3aed; }

    /* ── Print overrides ── */
    @media print {
      body { background: #fff; }
      .page { padding: 20px 24px 40px; }
      .no-print { display: none !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }

    /* ── Print button (screen only) ── */
    .print-btn {
      display: block;
      margin: 24px auto 0;
      padding: 10px 32px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.02em;
    }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="brand-logo">
        <div class="logo-mark">R</div>
        <div>
          <div class="brand-name">${restName}</div>
          <div class="brand-tagline">Business Intelligence Suite</div>
        </div>
      </div>
      <div class="header-meta">
        <div class="doc-label">Official Report</div>
        <div class="doc-date">${dateStr} &nbsp;·&nbsp; ${timeStr}</div>
      </div>
    </div>

    <!-- Title bar -->
    <div class="title-bar">
      <div>
        <h1>${title}</h1>
        <div class="subtitle">${subtitle}</div>
      </div>
      <div class="badge">📅 ${period}</div>
    </div>

    <!-- Summary strip -->
    <div class="summary-strip">
      <div class="summary-card">
        <div class="label">Total Data Rows</div>
        <div class="value">${totalRows}</div>
      </div>
      <div class="summary-card">
        <div class="label">Report Columns</div>
        <div class="value">${headers.length}</div>
      </div>
      <div class="summary-card">
        <div class="label">Generated At</div>
        <div class="value" style="font-size:13px">${timeStr}</div>
      </div>
    </div>

    <!-- Data section -->
    <div class="section-heading">Report Data</div>
    <table>
      <thead>
        <tr>${headers.map((h, i) => `<th class="${i > 0 ? 'num' : ''}">${h}</th>`).join('')}</tr>
      </thead>
      <tbody>${tableBody}</tbody>
      ${totalFooter}
    </table>

    <!-- Footer -->
    <div class="footer">
      <span>Generated by <strong>RestroAI</strong> Business Intelligence Suite</span>
      <span>Confidential · For Internal Use Only</span>
      <span>© ${now.getFullYear()} RestroAI</span>
    </div>

    <!-- Print trigger button (hidden in print view) -->
    <button class="print-btn no-print" onclick="window.print()">🖨️ Save as PDF</button>

  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=1000,height=750')
  if (!win) {
    alert('Please allow popups for this site to open PDF reports.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
}

// ─── Report-specific builders ────────────────────────────────────────────────

/**
 * Build rows for a Sales / Summary report.
 */
export function buildSalesRows(trends, summary) {
  const headers = ['Date', 'Revenue (₹)', 'Orders', 'Avg Bill (₹)']
  const dataRows = (trends || []).map(day => [
    day._id,
    Number(day.revenue || 0).toFixed(2),
    day.orders,
    day.orders > 0 ? (day.revenue / day.orders).toFixed(2) : '0.00'
  ])

  // Append summary footer
  dataRows.push([''])
  dataRows.push(['TOTAL', Number(summary?.totalRevenue || 0).toFixed(2), summary?.totalOrders || 0, Number(summary?.avgBill || 0).toFixed(2)])

  return [headers, ...dataRows]
}

/**
 * Build rows for an Item-wise report.
 */
export function buildItemwiseRows(topItems) {
  const headers = ['#', 'Item Name', 'Qty Sold', 'Total Revenue (₹)', 'Avg Price (₹)']
  const dataRows = (topItems || []).map((item, i) => [
    i + 1,
    item.name,
    item.count,
    Number(item.revenue || 0).toFixed(2),
    item.count > 0 ? (item.revenue / item.count).toFixed(2) : '0.00'
  ])
  return [headers, ...dataRows]
}

/**
 * Build rows for a GST report.
 */
export function buildGSTRows(trends, summary) {
  const headers = ['Date', 'Revenue (₹)', 'GST (₹)', 'CGST (₹)', 'SGST (₹)']
  const dataRows = (trends || []).map(day => {
    const gst = Number(day.gst || 0)
    return [
      day._id,
      Number(day.revenue || 0).toFixed(2),
      gst.toFixed(2),
      (gst / 2).toFixed(2),
      (gst / 2).toFixed(2)
    ]
  })
  const totalGst = Number(summary?.totalGst || 0)
  dataRows.push([''])
  dataRows.push(['TOTAL', Number(summary?.totalRevenue || 0).toFixed(2), totalGst.toFixed(2), (totalGst / 2).toFixed(2), (totalGst / 2).toFixed(2)])
  return [headers, ...dataRows]
}

/**
 * Build rows for a Loyalty Performance report.
 */
export function buildLoyaltyRows(loyalty) {
  const headers = ['Metric', 'Value']
  return [
    headers,
    ['Total Customers Enrolled', loyalty?.totalCustomers || 0],
    ['Total Points Issued', loyalty?.totalPointsIssued || 0],
    ['Platinum Members', loyalty?.platinumMembers || 0],
    ['Avg Points Per Customer', loyalty?.totalCustomers > 0 ? Math.round((loyalty?.totalPointsIssued || 0) / loyalty.totalCustomers) : 0],
  ]
}
