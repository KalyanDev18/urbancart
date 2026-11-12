import React, { useState, useEffect } from 'react';
import { X, Printer, ExternalLink, ShieldCheck, Download, FileText } from 'lucide-react';
import { api, API_BASE_URL } from '../api/client';

export function numberToWordsINR(amount) {
  try {
    let val = Math.floor(Number(amount));
    if (!val || val <= 0) return 'Zero Rupees Only';

    const units = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const twoDigits = (n) => {
      if (n < 20) return units[n];
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ` ${units[n % 10]}` : '');
    };

    const threeDigits = (n) => {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      let res = '';
      if (h > 0) {
        res += `${units[h]} Hundred`;
        if (rem > 0) res += ' and ';
      }
      if (rem > 0) res += twoDigits(rem);
      return res;
    };

    const parts = [];
    const crores = Math.floor(val / 10000000);
    val %= 10000000;
    const lakhs = Math.floor(val / 100000);
    val %= 100000;
    const thousands = Math.floor(val / 1000);
    val %= 1000;
    const hundreds = val;

    if (crores > 0) parts.push(`${threeDigits(crores)} Crore`);
    if (lakhs > 0) parts.push(`${twoDigits(lakhs)} Lakh`);
    if (thousands > 0) parts.push(`${twoDigits(thousands)} Thousand`);
    if (hundreds > 0) parts.push(threeDigits(hundreds));

    const words = parts.join(' ').trim();
    return words ? `${words} Rupees Only` : 'Zero Rupees Only';
  } catch {
    return 'Rupees Only';
  }
}

export default function InvoiceModal({ order, orderId, onClose }) {
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const targetOrderId = order?.id || orderId;

  useEffect(() => {
    if (!targetOrderId) return;
    let isMounted = true;
    setLoading(true);
    api.getOrderInvoice(targetOrderId)
      .then((data) => {
        if (isMounted) {
          setInvoiceData(data);
          setErrorMsg('');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(err.message || 'Could not fetch official invoice data.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [targetOrderId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!targetOrderId) return null;

  const currentOrder = invoiceData?.order || order;
  const invNumber = invoiceData?.invoice_number || currentOrder?.invoice_number || `INV-2026-${String(targetOrderId).padStart(5, '0')}`;
  const invDate = invoiceData?.invoice_date || (currentOrder?.created_at ? new Date(currentOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '12 November 2026');

  const items = currentOrder?.items || [];
  const subtotal = items.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 1), 0);
  const totalAmount = Number(currentOrder?.total_amount || 0);
  const shippingFee = Math.max(0, totalAmount - subtotal);
  const taxableValue = subtotal > 0 ? (subtotal / 1.18) : 0;
  const gstValue = subtotal - taxableValue;

  const words = invoiceData?.tax_summary?.amount_in_words || numberToWordsINR(totalAmount);
  const htmlInvoiceUrl = `${API_BASE_URL || ''}/api/orders/${targetOrderId}/invoice/?format=html`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #urbancart-invoice-printable,
          #urbancart-invoice-printable * {
            visibility: visible !important;
          }
          #urbancart-invoice-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .invoice-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 15, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 880,
            maxHeight: '94vh',
            overflowY: 'auto',
            background: 'var(--bg-card, #ffffff)',
            borderRadius: 18,
            border: '1px solid var(--border-subtle, #e2e8f0)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Modal Sticky Header / Action Controls (Hidden when printed) */}
          <div
            className="invoice-no-print"
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
              background: 'var(--bg-surface, #f8fafc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  Tax Invoice #{invNumber}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-dim, #64748b)' }}>
                  Order #{targetOrderId} • GST Compliant
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a
                href={htmlInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-main, #0f172a)',
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-strong, #cbd5e1)',
                  padding: '7px 12px',
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ExternalLink size={14} /> Full View
              </a>

              <button
                onClick={handlePrint}
                className="btn-gold"
                style={{
                  fontSize: '0.82rem',
                  padding: '7px 14px',
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Printer size={15} /> Print / Save PDF
              </button>

              <button
                onClick={onClose}
                aria-label="Close invoice"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  color: 'var(--text-main, #0f172a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginLeft: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Invoice Document */}
          <div style={{ padding: 'clamp(18px, 4vw, 36px)', background: '#ffffff', color: '#0f172a' }}>
            <div
              id="urbancart-invoice-printable"
              style={{
                background: '#ffffff',
                color: '#0f172a',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                lineHeight: 1.5,
              }}
            >
              {/* Top Seller & Invoice Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 20,
                paddingBottom: 20,
                borderBottom: '2px solid #0f172a',
                marginBottom: 20,
              }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      display: 'inline-block',
                      background: '#d97706',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: 14,
                      width: 30,
                      height: 30,
                      lineHeight: '30px',
                      borderRadius: 8,
                      textAlign: 'center',
                    }}>
                      UC
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#090d16', letterSpacing: '-0.5px' }}>
                      Urban<span style={{ color: '#d97706' }}>Cart</span>
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    UrbanCart Retail Private Limited
                  </div>
                  <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5, marginTop: 4 }}>
                    DLF Cyber City, Building 10, DLF Phase 2<br />
                    Gurugram, Haryana - 122002, India<br />
                    <strong>GSTIN:</strong> 07AAACU1234F1Z8 | <strong>CIN:</strong> U52100HR2026PTC109988<br />
                    <strong>Care:</strong> care@urbancart.in | +91 1800-URBANCART
                  </div>
                </div>

                <div style={{ flex: '1 1 240px', textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-block',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#059669',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>
                    Original for Recipient
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', color: '#0f172a', letterSpacing: '-0.5px' }}>
                    TAX INVOICE
                  </h2>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                    <div><strong>Invoice No:</strong> <span style={{ color: '#d97706', fontWeight: 800 }}>{invNumber}</span></div>
                    <div><strong>Invoice Date:</strong> {invDate}</div>
                    <div><strong>Order ID:</strong> #{targetOrderId}</div>
                    <div><strong>Place of Supply:</strong> {currentOrder?.city || 'India'} (State: 06 - HR)</div>
                  </div>
                </div>
              </div>

              {/* Billed To & Payment Meta Box */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '14px 18px',
                background: '#f8fafc',
                marginBottom: 22,
                fontSize: 12.5,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.6, marginBottom: 4 }}>
                    Billed &amp; Shipped To (Customer)
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    {currentOrder?.full_name || 'Valued Customer'}
                  </div>
                  <div style={{ color: '#334155', marginTop: 2 }}>
                    {currentOrder?.address || 'Shipping Address'}
                  </div>
                  <div style={{ color: '#334155' }}>
                    {currentOrder?.city}{currentOrder?.postal_code ? ` - ${currentOrder.postal_code}` : ''}, India
                  </div>
                  <div style={{ color: '#64748b', marginTop: 4 }}>
                    Email: {currentOrder?.email}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.6, marginBottom: 4 }}>
                    Payment &amp; Logistics Mode
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 700 }}>
                    Payment Method: <span style={{ fontWeight: 600 }}>{currentOrder?.payment_method || 'Online'}</span>
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 700 }}>
                    Payment Status: <span style={{ color: currentOrder?.payment_status === 'Paid' ? '#059669' : '#d97706', fontWeight: 800 }}>{currentOrder?.payment_status || 'Pending'}</span>
                  </div>
                  <div style={{ color: '#475569', fontSize: 11.5, marginTop: 2 }}>
                    Transaction Ref: <span style={{ fontFamily: 'monospace' }}>{currentOrder?.transaction_id || 'PAY-VERIFIED'}</span>
                  </div>
                  <div style={{ color: '#475569', fontSize: 11.5, marginTop: 2 }}>
                    Courier: UrbanCart Pan-India Express Logistics
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#090d16', color: '#ffffff', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '9px 8px', textAlign: 'center', width: '5%' }}>#</th>
                      <th style={{ padding: '9px 8px', textAlign: 'left', width: '40%' }}>Description of Goods</th>
                      <th style={{ padding: '9px 8px', textAlign: 'center', width: '10%' }}>HSN Code</th>
                      <th style={{ padding: '9px 8px', textAlign: 'center', width: '7%' }}>Qty</th>
                      <th style={{ padding: '9px 8px', textAlign: 'right', width: '12%' }}>Unit Price</th>
                      <th style={{ padding: '9px 8px', textAlign: 'right', width: '13%' }}>Taxable Val</th>
                      <th style={{ padding: '9px 8px', textAlign: 'right', width: '13%' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                          Order #{targetOrderId} items
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => {
                        const linePrice = Number(it.price || 0);
                        const lineQty = Number(it.quantity || 1);
                        const lineTotal = Number(it.get_total_price || (linePrice * lineQty));
                        const itemTaxable = (lineTotal / 1.18).toFixed(2);
                        const hsn = it.hsn_code || '6109';
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '9px 8px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '9px 8px' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.product_name}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>Category: {it.category || 'General'}</div>
                            </td>
                            <td style={{ padding: '9px 8px', textAlign: 'center', fontFamily: 'monospace', color: '#475569', fontSize: 11.5 }}>
                              {hsn}
                            </td>
                            <td style={{ padding: '9px 8px', textAlign: 'center', fontWeight: 600 }}>{lineQty}</td>
                            <td style={{ padding: '9px 8px', textAlign: 'right', color: '#475569' }}>₹{linePrice.toFixed(2)}</td>
                            <td style={{ padding: '9px 8px', textAlign: 'right', color: '#475569' }}>₹{itemTaxable}</td>
                            <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{lineTotal.toFixed(2)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals & Summary Calculation */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 24,
                marginBottom: 24,
                fontSize: 12.5,
              }}>
                <div>
                  <div style={{ fontSize: 11.5, color: '#475569', marginBottom: 4 }}>
                    <strong>Amount Chargeable (in words):</strong>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', lineHeight: 1.4 }}>
                    {words}
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginTop: 14,
                    fontSize: 11,
                    color: '#64748b',
                    lineHeight: 1.5,
                  }}>
                    <strong>Terms &amp; Conditions:</strong><br />
                    1. Goods sold are backed by UrbanCart's 7-Day Free Doorstep Return &amp; Replacement policy.<br />
                    2. GST (18%) is fully included in the invoice prices.<br />
                    3. For invoice inquiries or GST input claims, email us at care@urbancart.in.
                  </div>
                </div>

                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '5px 0', color: '#64748b' }}>Net Taxable Value:</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>₹{taxableValue.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 0', color: '#64748b' }}>Integrated GST (18% Included):</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>₹{gstValue.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 0', color: '#64748b' }}>Items Subtotal:</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>₹{subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 0', color: '#64748b' }}>Express Delivery Charges:</td>
                        <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>₹{shippingFee.toFixed(2)}</td>
                      </tr>
                      <tr style={{ borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                        <td style={{ padding: '9px 0', fontSize: 15, fontWeight: 900, color: '#0f172a' }}>Total Amount Paid:</td>
                        <td style={{ padding: '9px 0', textAlign: 'right', fontSize: 17, fontWeight: 900, color: '#d97706' }}>
                          ₹{totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Signature & Digital Verification */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                paddingTop: 18,
                borderTop: '1px solid #e2e8f0',
                fontSize: 11.5,
                color: '#64748b',
              }}>
                <div style={{ maxWidth: 420 }}>
                  🔒 <strong>Digital Authentication Notice:</strong><br />
                  This is a computer-generated tax invoice issued in accordance with Section 31 of the CGST Act, 2017. No physical signature is required.
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    For UrbanCart Retail Private Limited
                  </div>
                  <div style={{
                    display: 'inline-block',
                    border: '2px dashed #059669',
                    background: '#ecfdf5',
                    borderRadius: 8,
                    padding: '6px 14px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#059669' }}>✓ DIGITALLY SIGNED</div>
                    <div style={{ fontSize: 10, color: '#047857' }}>Authorized Signatory: Kalyan Dev</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
