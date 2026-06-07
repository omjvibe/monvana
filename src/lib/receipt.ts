/**
 * Monvana Bank — Branded Transaction Receipt Generator
 *
 * Opens a clean print-friendly browser window styled with a premium dark/green
 * branded layout and triggers window.print() for PDF download or printing.
 *
 * No library dependencies — works natively in all modern browsers.
 */

export interface ReceiptTransaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    description?: string;
    reference?: string;
    recipient_name?: string;
    recipient_account?: string;
    recipient_bank?: string;
    sender_name?: string;
    sender_account?: string;
    sender_bank?: string;
    created_at: string;
    currency?: string;
}

function formatCurrency(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
    });
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}

function getStatusColor(status: string): string {
    switch (status) {
        case "approved":  return "#00DF89";
        case "pending":   return "#f59e0b";
        case "processing":
        case "on_hold":   return "#60a5fa";
        case "failed":
        case "cancelled": return "#ef4444";
        default:          return "#a1a1aa";
    }
}

export function downloadReceipt(tx: ReceiptTransaction): void {
    const statusColor = getStatusColor(tx.status);
    const currency = tx.currency ?? "USD";
    const isCredit = ["deposit", "bonus", "refund"].includes(tx.type) ||
        (tx.type === "transfer" && Boolean(tx.sender_name));

    const rows: [string, string][] = [
        ["Transaction ID",   tx.id],
        ["Reference",        tx.reference ?? "N/A"],
        ["Date & Time",      formatDate(tx.created_at)],
        ["Transaction Type", capitalize(tx.type)],
        ["Amount",           formatCurrency(tx.amount, currency)],
        ["Status",           capitalize(tx.status)],
    ];

    if (tx.description) rows.push(["Description", tx.description]);
    if (tx.recipient_name) rows.push(["Recipient Name", tx.recipient_name]);
    if (tx.recipient_account) rows.push(["Recipient Account", tx.recipient_account]);
    if (tx.recipient_bank) rows.push(["Recipient Bank", tx.recipient_bank]);
    if (tx.sender_name) rows.push(["Sender Name", tx.sender_name]);
    if (tx.sender_account) rows.push(["Sender Account", tx.sender_account]);
    if (tx.sender_bank) rows.push(["Sender Bank", tx.sender_bank]);

    const tableRows = rows.map(([label, value]) => `
        <tr>
            <td style="padding:12px 16px;color:#a1a1aa;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #1a1a1a;width:38%;">${label}</td>
            <td style="padding:12px 16px;color:#f4f4f5;font-size:13px;border-bottom:1px solid #1a1a1a;">${
                label === "Status"
                    ? `<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;background:${statusColor}20;color:${statusColor};font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">
                           <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${statusColor};"></span>
                           ${value}
                       </span>`
                    : label === "Amount"
                    ? `<span style="font-size:15px;font-weight:700;color:${isCredit ? "#00DF89" : "#f4f4f5"};">${isCredit ? "+" : "-"}${value}</span>`
                    : label === "Transaction ID" || label === "Reference"
                    ? `<span style="font-family:monospace;font-size:11px;color:#71717a;">${value}</span>`
                    : value
            }</td>
        </tr>
    `).join("");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Transaction Receipt — Monvana Bank</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0a0a0a;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #f4f4f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 16px;
        }
        .wrapper { max-width: 600px; width: 100%; margin: 0 auto; }

        /* Header */
        .brand { text-align: center; margin-bottom: 32px; }
        .brand-name {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #ffffff;
        }
        .brand-name span { color: #00DF89; }
        .brand-sub {
            font-size: 10px;
            color: #52525b;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            margin-top: 5px;
        }

        /* Card */
        .card {
            background: #141414;
            border: 1px solid #1e1e1e;
            border-radius: 20px;
            overflow: hidden;
        }
        .card-top-bar {
            height: 3px;
            background: linear-gradient(90deg, #00DF89, #00b870, #00DF89);
        }
        .card-body { padding: 36px; }

        /* Amount hero */
        .amount-hero {
            text-align: center;
            padding: 28px 0 32px;
            border-bottom: 1px solid #1e1e1e;
            margin-bottom: 8px;
        }
        .amount-label {
            font-size: 11px;
            color: #52525b;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            margin-bottom: 10px;
        }
        .amount-value {
            font-size: 42px;
            font-weight: 800;
            color: ${isCredit ? "#00DF89" : "#f4f4f5"};
            letter-spacing: -0.02em;
        }
        .amount-prefix {
            font-size: 24px;
            font-weight: 600;
            color: ${isCredit ? "#00DF89" : "#71717a"};
            vertical-align: super;
            margin-right: 2px;
        }
        .tx-type-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 12px;
            padding: 4px 14px;
            border-radius: 999px;
            background: rgba(0,223,137,0.08);
            border: 1px solid rgba(0,223,137,0.2);
            color: #00DF89;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        /* Table */
        .details-table { width: 100%; border-collapse: collapse; margin-top: 8px; }

        /* Security notice */
        .security-notice {
            margin-top: 28px;
            padding: 14px 18px;
            background: rgba(255,255,255,0.02);
            border: 1px solid #1e1e1e;
            border-radius: 12px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        .security-icon {
            font-size: 18px;
            margin-top: 1px;
            flex-shrink: 0;
        }
        .security-text { font-size: 11px; color: #52525b; line-height: 1.6; }
        .security-text strong { color: #71717a; }

        /* Footer */
        .receipt-footer {
            text-align: center;
            margin-top: 28px;
            padding-top: 24px;
            border-top: 1px solid #1a1a1a;
        }
        .footer-text { font-size: 11px; color: #3f3f46; }
        .footer-text a { color: #52525b; text-decoration: none; }

        @media print {
            body { background: #0a0a0a !important; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
<div class="wrapper">

    <!-- Brand -->
    <div class="brand">
        <div class="brand-name">MONVANA<span>BANK</span></div>
        <div class="brand-sub">Official Transaction Receipt</div>
    </div>

    <!-- Card -->
    <div class="card">
        <div class="card-top-bar"></div>
        <div class="card-body">

            <!-- Amount hero -->
            <div class="amount-hero">
                <div class="amount-label">${isCredit ? "Amount Received" : "Amount Sent"}</div>
                <div class="amount-value">
                    <span class="amount-prefix">${isCredit ? "+" : "-"}$</span>${Number(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div>
                    <span class="tx-type-badge">
                        ${capitalize(tx.type)}
                    </span>
                </div>
            </div>

            <!-- Transaction Details Table -->
            <table class="details-table">
                ${tableRows}
            </table>

            <!-- Security Notice -->
            <div class="security-notice">
                <div class="security-icon">🔒</div>
                <div class="security-text">
                    <strong>Secure Transaction Record</strong> — This receipt is an official record generated by Monvana Bank's secure systems. If you did not authorize this transaction, please contact our support team immediately at <strong>support@monvana.online</strong>. All transactions are encrypted with 256-bit SSL and monitored 24/7.
                </div>
            </div>

        </div>
    </div>

    <!-- Print button (hidden on print) -->
    <div class="no-print" style="text-align:center;margin-top:24px;">
        <button onclick="window.print()"
            style="background:#00DF89;color:#000;border:none;padding:12px 32px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;letter-spacing:0.02em;">
            ⬇ Download / Print PDF
        </button>
        <button onclick="window.close()"
            style="margin-left:12px;background:transparent;color:#52525b;border:1px solid #2a2a2a;padding:12px 24px;border-radius:10px;font-weight:500;font-size:14px;cursor:pointer;">
            Close
        </button>
    </div>

    <!-- Footer -->
    <div class="receipt-footer">
        <p class="footer-text">© ${new Date().getFullYear()} Monvana Bank &bull; <a href="https://monvana.online">monvana.online</a> &bull; All rights reserved</p>
        <p class="footer-text" style="margin-top:4px;">Regulated Digital Banking Institution &bull; ISO 27001 Certified</p>
    </div>

</div>
<script>
    // Auto-trigger print after a brief moment for assets to load
    setTimeout(() => window.print(), 800);
</script>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank", "width=700,height=900,scrollbars=yes");
    if (!printWindow) {
        alert("Please allow popups for Monvana Bank to download receipts.");
        return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
}
