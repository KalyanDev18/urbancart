import html
import json
import os
import sys
import threading
import urllib.request
import urllib.error
from decimal import Decimal
from django.conf import settings
from django.core.mail import send_mail


def generate_otp_email_html(otp):
    safe_otp = html.escape(str(otp))
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UrbanCart Login OTP</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);">
    <div style="background: #090d16; padding: 28px 24px; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; font-weight: 800; font-size: 15px; width: 36px; height: 36px; line-height: 36px; border-radius: 10px; text-align: center; vertical-align: middle;">UC</span>
        <span style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; vertical-align: middle;">
          Urban<span style="color: #f59e0b;">Cart</span>
        </span>
      </div>
      <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; font-weight: 600;">
        Stylio Secure Authentication
      </div>
    </div>

    <div style="padding: 36px 28px; text-align: center;">
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
        Your Login Verification Code
      </h2>
      <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
        Use the 6-digit One-Time Password (OTP) below to securely log into your UrbanCart account.
      </p>

      <div style="background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 14px; padding: 20px 24px; margin: 20px auto; display: inline-block;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 12px; color: #b45309; display: block; margin-left: 12px;">
          {safe_otp}
        </span>
      </div>

      <div style="font-size: 13px; color: #64748b; margin-top: 14px;">
        ⏳ This code will expire in <strong style="color: #0f172a;">10 minutes</strong>.
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-top: 28px; text-align: left; font-size: 12px; color: #475569; line-height: 1.5;">
        🔒 <strong>Security Tip:</strong> Never share this OTP with anyone, including UrbanCart representatives. If you did not request this code, you can safely ignore this message.
      </div>
    </div>

    <div style="background: #070b12; color: #94a3b8; font-size: 11px; text-align: center; padding: 22px 20px; line-height: 1.6; border-top: 1px solid #1e293b;">
      © 2026 UrbanCart. All Rights Reserved.<br>
      Designed &amp; Developed with ❤️ by <strong style="color: #f59e0b;">Kalyan Dev</strong>.
    </div>
  </div>
</body>
</html>"""


def _send_via_webhook(webhook_url, email, subject, plain_text, html_text):
    """Dispatches email via Google Apps Script / HTTPS webhook over port 443."""
    payload = json.dumps({
        'to': email,
        'subject': subject,
        'text': plain_text,
        'html': html_text,
    }).encode('utf-8')
    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={'Content-Type': 'application/json', 'User-Agent': 'UrbanCart-Mailer/1.0'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=8) as resp:
        body = resp.read().decode('utf-8', 'ignore')
        if resp.status >= 400:
            raise RuntimeError(f"Webhook returned HTTP {resp.status}: {body[:200]}")
        try:
            parsed = json.loads(body)
            if parsed.get('ok') is False or parsed.get('status') == 'error':
                raise RuntimeError(parsed.get('error', 'Webhook error'))
        except ValueError:
            pass


def _send_via_brevo(api_key, sender_email, email, subject, plain_text, html_text):
    """Dispatches email via Brevo HTTPS REST API (Port 443, delivers to ANY email address, 300 free/day)."""
    clean_sender = sender_email if (sender_email and '@' in sender_email) else 'kdev23416@gmail.com'
    payload = json.dumps({
        'sender': {'name': 'UrbanCart', 'email': clean_sender},
        'to': [{'email': email}],
        'subject': subject,
        'textContent': plain_text,
        'htmlContent': html_text,
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://api.brevo.com/v3/smtp/email',
        data=payload,
        headers={
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': api_key,
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=8) as resp:
        if resp.status >= 400:
            body = resp.read().decode('utf-8', 'ignore')
            raise RuntimeError(f"Brevo returned HTTP {resp.status}: {body[:200]}")


def _send_via_resend(api_key, sender_email, email, subject, plain_text, html_text):
    """Dispatches email via Resend HTTPS REST API (Port 443)."""
    from_addr = sender_email if (sender_email and '<' in sender_email) else f"UrbanCart <{sender_email or 'onboarding@resend.dev'}>"
    payload = json.dumps({
        'from': from_addr,
        'to': [email],
        'subject': subject,
        'text': plain_text,
        'html': html_text,
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://api.resend.com/emails',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status >= 400:
                body = resp.read().decode('utf-8', 'ignore')
                raise RuntimeError(f"Resend returned HTTP {resp.status}: {body[:200]}")
    except urllib.error.HTTPError as he:
        body = he.read().decode('utf-8', 'ignore')
        if he.code == 403:
            raise RuntimeError(
                f"Resend 403 Forbidden: Resend unverified account only sends to account owner email. "
                f"To send to '{email}', verify custom domain on resend.com or use Brevo/Google Apps Script."
            )
        raise RuntimeError(f"Resend HTTP {he.code}: {body[:200]}")


def send_email(to_email, subject, plain_text, html_text):
    """
    Dispatches styled email over HTTPS API (Render Free-Tier compatible) or SMTP fallback.
    Executes configured services in order with graceful multi-provider fallback.
    Returns (success: bool, error_msg: str or None).
    """
    if not to_email or '@' not in str(to_email):
        return False, "Invalid recipient email address."

    to_email = str(to_email).strip().lower()
    from_email = getattr(settings, 'EMAIL_HOST_USER', '') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'UrbanCart <noreply@urbancart.com>')
    errors = []

    # 1. HTTPS Webhook (Google Apps Script Web App over port 443 — sends to ANY email)
    webhook_url = os.environ.get('EMAIL_WEBHOOK_URL', '').strip()
    if webhook_url:
        try:
            _send_via_webhook(webhook_url, to_email, subject, plain_text, html_text)
            return True, None
        except Exception as e:
            errors.append(f"Webhook: {e}")

    # 2. Brevo HTTP REST API (Port 443 — sends to ANY recipient email, 300 free/day)
    brevo_key = os.environ.get('BREVO_API_KEY', '').strip()
    if brevo_key:
        try:
            sender = getattr(settings, 'EMAIL_HOST_USER', '') or os.environ.get('BREVO_SENDER_EMAIL', '') or 'kdev23416@gmail.com'
            _send_via_brevo(brevo_key, sender, to_email, subject, plain_text, html_text)
            return True, None
        except Exception as e:
            errors.append(f"Brevo: {e}")

    # 3. Resend HTTP REST API (Port 443)
    resend_key = os.environ.get('RESEND_API_KEY', '').strip()
    if resend_key:
        try:
            _send_via_resend(resend_key, getattr(settings, 'RESEND_FROM_EMAIL', ''), to_email, subject, plain_text, html_text)
            return True, None
        except Exception as e:
            errors.append(f"Resend: {e}")

    # 4. Standard SMTP fallback (Port 587 — works locally & on hosts where port 587 is open)
    try:
        send_mail(
            subject=subject,
            message=plain_text,
            from_email=from_email,
            recipient_list=[to_email],
            html_message=html_text,
            fail_silently=False
        )
        return True, None
    except Exception as e:
        err_str = str(e)
        if 'timed out' in err_str.lower() or '101' in err_str or 'network is unreachable' in err_str.lower():
            errors.append("Render Free tier blocks outbound SMTP port 587. Configure EMAIL_WEBHOOK_URL or BREVO_API_KEY for HTTPS delivery.")
        else:
            errors.append(f"SMTP: {err_str}")

    combined = " | ".join(errors) if errors else "No email backend available."
    return False, combined


def send_otp_email(email, otp):
    """
    Dispatches styled OTP email over HTTPS API (Render Free-Tier compatible) or SMTP fallback.
    Returns (success: bool, error_msg: str or None).
    """
    subject = f"Your UrbanCart Login OTP: {otp}"
    plain_text = (
        f"Hello,\n\n"
        f"Your 6-digit login verification code for UrbanCart is: {otp}\n\n"
        f"This code will expire in 10 minutes.\n"
        f"Please do not share this OTP with anyone for your account security.\n\n"
        f"Happy Shopping,\n"
        f"Team UrbanCart\n"
    )
    html_text = generate_otp_email_html(otp)
    return send_email(email, subject, plain_text, html_text)


ORDER_EMAIL_STATUS_CONFIG = {
    'CONFIRMED': {
        'badge': 'ORDER CONFIRMED',
        'badge_bg': '#ecfdf5',
        'badge_color': '#059669',
        'badge_border': '#a7f3d0',
        'icon': '🎉',
        'headline': 'Your Order is Confirmed!',
        'subject_prefix': '🎉 Order Confirmed',
        'intro': 'Thank you for shopping with UrbanCart! We have received your order and our team is preparing it for express dispatch.',
        'next_step': 'We will notify you by email as soon as your package is picked up by our courier partner.',
    },
    'SHIPPED': {
        'badge': 'ORDER SHIPPED',
        'badge_bg': '#eff6ff',
        'badge_color': '#2563eb',
        'badge_border': '#bfdbfe',
        'icon': '🚚',
        'headline': 'Your Order is On The Way!',
        'subject_prefix': '🚚 Order Shipped',
        'intro': 'Great news! Your package has been dispatched via UrbanCart Express Logistics and is heading to your doorstep.',
        'next_step': 'Estimated delivery within 2 to 3 business days. Please keep your phone reachable for delivery coordination.',
    },
    'DELIVERED': {
        'badge': 'ORDER DELIVERED',
        'badge_bg': '#ecfdf5',
        'badge_color': '#059669',
        'badge_border': '#a7f3d0',
        'icon': '📦',
        'headline': 'Your Package Has Arrived!',
        'subject_prefix': '📦 Order Delivered',
        'intro': 'Your UrbanCart package has been successfully delivered. We hope you love your new purchase!',
        'next_step': 'Need an exchange? You have a 7-day hassle-free return window from your Dashboard. Love it? Share a product review on UrbanCart!',
    },
    'CANCELLED': {
        'badge': 'ORDER CANCELLED',
        'badge_bg': '#fef2f2',
        'badge_color': '#dc2626',
        'badge_border': '#fecaca',
        'icon': '❌',
        'headline': 'Order Cancelled',
        'subject_prefix': '❌ Order Cancelled',
        'intro': 'This order has been cancelled as requested.',
        'next_step': 'If any online payment was made, a full refund has been initiated and will reflect in 2–3 business days.',
    },
    'RETURN_REQUESTED': {
        'badge': 'RETURN REQUESTED',
        'badge_bg': '#faf5ff',
        'badge_color': '#7c3aed',
        'badge_border': '#e9d5ff',
        'icon': '🔄',
        'headline': 'Return / Replacement Scheduled',
        'subject_prefix': '🔄 Return Request Received',
        'intro': 'We have registered your return/replacement request and scheduled your reverse doorstep pickup.',
        'next_step': 'Our courier executive will arrive within 24–48 hours. Please keep the product packed with original tags/box.',
    },
    'RETURNED': {
        'badge': 'RETURN COMPLETED',
        'badge_bg': '#f0fdfa',
        'badge_color': '#0d9488',
        'badge_border': '#99f6e4',
        'icon': '✅',
        'headline': 'Return Verified & Completed',
        'subject_prefix': '✅ Order Returned',
        'intro': 'Your returned item has reached our warehouse and passed quality inspection.',
        'next_step': 'Your refund has been approved and processed back to your original payment method.',
    },
    'REFUNDED': {
        'badge': 'REFUND PROCESSED',
        'badge_bg': '#ecfeff',
        'badge_color': '#0891b2',
        'badge_border': '#a5f3fc',
        'icon': '💰',
        'headline': 'Refund Successfully Processed',
        'subject_prefix': '💰 Refund Processed',
        'intro': 'Your refund for this order has been processed cleanly to your original payment source.',
        'next_step': 'Please allow 2–3 business days for the amount to appear in your bank/UPI statement.',
    },
}


def _normalize_order_status_type(status_type, payment_status=''):
    key = str(status_type or 'CONFIRMED').strip().upper().replace(' ', '_')
    if key in ('PROCESSING', 'PLACED', 'NEW'):
        return 'CONFIRMED'
    if key == 'RETURNED' and str(payment_status).strip().lower() == 'refunded':
        return 'REFUNDED'
    if key in ORDER_EMAIL_STATUS_CONFIG:
        return key
    return 'CONFIRMED'


def _should_send_sync():
    return (
        'test' in sys.argv
        or getattr(settings, 'EMAIL_BACKEND', '').endswith('locmem.EmailBackend')
        or bool(getattr(settings, 'EMAIL_SYNC', False))
    )


def build_order_email_content(order_info, status_type, extra_note=None):
    config = ORDER_EMAIL_STATUS_CONFIG.get(status_type, ORDER_EMAIL_STATUS_CONFIG['CONFIRMED'])
    order_id = order_info['id']
    full_name = order_info['full_name']
    safe_name = html.escape(full_name)
    safe_address = html.escape(order_info['address'])
    safe_city = html.escape(order_info['city'])
    safe_postal = html.escape(order_info['postal_code'])
    safe_payment_method = html.escape(order_info['payment_method'])
    safe_payment_status = html.escape(order_info['payment_status'])
    safe_order_status = html.escape(order_info['order_status'])
    safe_tx = html.escape(order_info.get('transaction_id') or '')

    app_url = os.environ.get('FRONTEND_URL', 'https://urbancart-amber.vercel.app').rstrip('/')
    subject = f"{config['subject_prefix']}: Order #{order_id} — UrbanCart"

    items = order_info.get('items') or []
    subtotal_dec = Decimal('0.00')
    items_rows_html = ''
    items_plain_lines = []

    for it in items:
        item_name = str(it.get('name') or 'Urban Item')
        qty = int(it.get('quantity') or 1)
        price_str = str(it.get('price') or '0.00')
        line_total_str = str(it.get('total') or '0.00')
        try:
            subtotal_dec += Decimal(line_total_str)
        except Exception:
            pass

        items_plain_lines.append(f"  • {qty}x {item_name} — ₹{line_total_str}")
        items_rows_html += (
            f'<tr>'
            f'<td style="padding: 10px 6px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">{html.escape(item_name)}</td>'
            f'<td style="padding: 10px 6px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #475569;">{qty}</td>'
            f'<td style="padding: 10px 6px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #475569;">₹{html.escape(price_str)}</td>'
            f'<td style="padding: 10px 6px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #0f172a;">₹{html.escape(line_total_str)}</td>'
            f'</tr>'
        )

    total_str = str(order_info.get('total_amount') or '0.00')
    try:
        total_dec = Decimal(total_str)
        shipping_dec = max(Decimal('0.00'), total_dec - subtotal_dec) if items else Decimal('99.00')
    except Exception:
        shipping_dec = Decimal('99.00')

    if not items_rows_html:
        items_rows_html = (
            f'<tr><td colspan="4" style="padding: 12px 6px; text-align: center; color: #64748b;">'
            f'Order #{order_id} items summary'
            f'</td></tr>'
        )
        items_plain_lines.append(f"  • Order #{order_id}")

    reason_blocks_html = ''
    reason_plain = ''
    cancel_reason = (order_info.get('cancel_reason') or '').strip()
    return_reason = (order_info.get('return_reason') or '').strip()
    refund_amount = str(order_info.get('refund_amount') or '0.00')
    refund_ref = (order_info.get('refund_reference') or '').strip()

    if cancel_reason:
        reason_plain += f"\nCancellation Reason: {cancel_reason}"
        reason_blocks_html += (
            f'<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; margin: 14px 0; font-size: 13px; color: #991b1b;">'
            f'<strong>Cancellation Reason:</strong> {html.escape(cancel_reason)}'
            f'</div>'
        )
    if return_reason:
        reason_plain += f"\nReturn Reason: {return_reason}"
        reason_blocks_html += (
            f'<div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; padding: 12px 16px; margin: 14px 0; font-size: 13px; color: #6b21a8;">'
            f'<strong>Return Details:</strong> {html.escape(return_reason)}'
            f'</div>'
        )
    try:
        has_refund = Decimal(refund_amount) > Decimal('0.00')
    except Exception:
        has_refund = False
    if has_refund or refund_ref:
        refund_line = f"₹{refund_amount}" if has_refund else "N/A"
        reason_plain += f"\nRefund Amount: {refund_line}"
        if refund_ref:
            reason_plain += f" | Ref ID: {refund_ref}"
        reason_blocks_html += (
            f'<div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px 18px; margin: 14px 0; font-size: 13px; color: #065f46; line-height: 1.6;">'
            f'<div style="font-weight: 800; margin-bottom: 4px;">💰 Refund &amp; Reference Summary</div>'
            f'<div><strong>Amount:</strong> {html.escape(refund_line)}</div>'
            + (f'<div><strong>Reference ID:</strong> <code style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #d1fae5;">{html.escape(refund_ref)}</code></div>' if refund_ref else '')
            + f'<div><strong>Payment Status:</strong> {safe_payment_status}</div>'
            f'</div>'
        )

    if extra_note:
        reason_plain += f"\nNote: {extra_note}"
        reason_blocks_html += (
            f'<div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin: 14px 0; font-size: 13px; color: #92400e;">'
            f'<strong>Update Note:</strong> {html.escape(str(extra_note))}'
            f'</div>'
        )

    plain_text = (
        f"UrbanCart Order Update — Order #{order_id}\n"
        f"Status: {config['headline']} ({order_info['order_status']})\n\n"
        f"Hi {full_name},\n\n"
        f"{config['intro']}\n"
        f"{config['next_step']}\n"
        f"{reason_plain}\n\n"
        f"ORDER SUMMARY:\n"
        f"Order ID: #{order_id}\n"
        f"Payment: {order_info['payment_method']} ({order_info['payment_status']})\n"
        f"Delivery Address: {order_info['address']}, {order_info['city']} - {order_info['postal_code']}\n\n"
        f"ITEMS:\n" + "\n".join(items_plain_lines) + "\n\n"
        f"Total Amount: ₹{total_str}\n\n"
        f"View & track your order anytime: {app_url}\n\n"
        f"Thank you for shopping with UrbanCart!\n"
        f"Team UrbanCart\n"
    )

    tx_row = (
        f'<tr><td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Transaction ID:</td>'
        f'<td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; text-align: right;">{safe_tx}</td></tr>'
        if safe_tx else ''
    )

    html_text = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(subject)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);">
    <div style="background: #090d16; padding: 26px 24px; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; font-weight: 800; font-size: 15px; width: 36px; height: 36px; line-height: 36px; border-radius: 10px; text-align: center; vertical-align: middle;">UC</span>
        <span style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; vertical-align: middle;">
          Urban<span style="color: #f59e0b;">Cart</span>
        </span>
      </div>
      <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; font-weight: 600;">
        Live Order Notification
      </div>
    </div>

    <div style="padding: 32px 26px;">
      <div style="text-align: center; margin-bottom: 22px;">
        <span style="display: inline-block; background: {config['badge_bg']}; color: {config['badge_color']}; border: 1px solid {config['badge_border']}; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase;">
          {config['icon']} {config['badge']}
        </span>
        <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 14px 0 8px;">
          {config['headline']}
        </h1>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 auto; max-width: 480px;">
          Hi <strong style="color: #0f172a;">{safe_name}</strong>, {config['intro']}
        </p>
      </div>

      <div style="background: #f8fafc; border-left: 4px solid {config['badge_color']}; border-radius: 8px; padding: 12px 16px; margin: 18px 0; font-size: 13px; color: #334155; line-height: 1.5;">
        <strong>What's Next:</strong> {config['next_step']}
      </div>

      {reason_blocks_html}

      <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 12px; margin: 20px 0; overflow: hidden; font-size: 13px; border: 1px solid #e2e8f0;">
        <tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Order Number:</td>
          <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #d97706; text-align: right;">#{order_id}</td>
        </tr>
        <tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Current Stage:</td>
          <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: {config['badge_color']}; text-align: right;">{safe_order_status}</td>
        </tr>
        <tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Payment Method:</td>
          <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; text-align: right;">{safe_payment_method} ({safe_payment_status})</td>
        </tr>
        {tx_row}
      </table>

      <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin: 22px 0 8px;">
        Order Items
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 8px 6px; text-align: left;">Product</th>
            <th style="padding: 8px 6px; text-align: center;">Qty</th>
            <th style="padding: 8px 6px; text-align: right;">Price</th>
            <th style="padding: 8px 6px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {items_rows_html}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px 6px 4px; text-align: right; color: #64748b;">Subtotal:</td>
            <td style="padding: 10px 6px 4px; text-align: right; font-weight: 600; color: #0f172a;">₹{subtotal_dec if items else total_str}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 4px 6px; text-align: right; color: #64748b;">Express Delivery:</td>
            <td style="padding: 4px 6px; text-align: right; font-weight: 600; color: #0f172a;">₹{shipping_dec}</td>
          </tr>
          <tr style="border-top: 1px solid #e2e8f0;">
            <td colspan="3" style="padding: 10px 6px; text-align: right; font-weight: 800; font-size: 14px; color: #0f172a;">Total Amount:</td>
            <td style="padding: 10px 6px; text-align: right; font-weight: 800; font-size: 16px; color: #d97706;">₹{html.escape(total_str)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin: 22px 0;">
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 6px;">
          Delivery Destination
        </div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">{safe_name}</div>
        <div style="font-size: 13px; color: #475569; line-height: 1.5;">{safe_address}, {safe_city} - {safe_postal}</div>
      </div>

      <div style="text-align: center; margin: 28px 0 8px;">
        <a href="{html.escape(app_url)}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 9999px;">
          Track Order on UrbanCart →
        </a>
      </div>
    </div>

    <div style="background: #070b12; color: #94a3b8; font-size: 11px; text-align: center; padding: 22px 20px; line-height: 1.6; border-top: 1px solid #1e293b;">
      © 2026 UrbanCart. All Rights Reserved.<br>
      Designed &amp; Developed with ❤️ by <strong style="color: #f59e0b;">Kalyan Dev</strong>.
    </div>
  </div>
</body>
</html>"""

    return subject, plain_text, html_text


def get_admin_emails():
    """Returns set of admin notification emails from ADMIN_EMAILS or fallback to EMAIL_HOST_USER."""
    raw = os.environ.get('ADMIN_EMAILS')
    if raw is not None:
        return {e.strip().lower() for e in raw.split(',') if e.strip()}
    host_user = getattr(settings, 'EMAIL_HOST_USER', '').strip().lower()
    if host_user and '@' in host_user:
        return {host_user}
    return set()


def send_order_status_email(order, status_type=None, extra_note=None, async_send=None, notify_admin=True):
    """
    Sends styled order lifecycle email (Confirmed, Shipped, Delivered, Cancelled, Return Requested, Refunded)
    to order.email (customer). Also dispatches store admin notification alerts on new orders & critical events.
    """
    if not order or not getattr(order, 'email', None):
        return False, "Order has no recipient email."

    if async_send is None:
        async_send = not _should_send_sync()

    try:
        payment_display = order.get_payment_method_display() if hasattr(order, 'get_payment_method_display') else order.payment_method
        order_info = {
            'id': order.id,
            'full_name': order.full_name or 'Valued Customer',
            'email': order.email.strip().lower(),
            'address': order.address or '',
            'city': order.city or '',
            'postal_code': order.postal_code or '',
            'total_amount': str(order.total_amount),
            'payment_method': payment_display or order.payment_method,
            'payment_status': order.payment_status,
            'order_status': order.order_status,
            'transaction_id': getattr(order, 'transaction_id', '') or '',
            'cancel_reason': getattr(order, 'cancel_reason', '') or '',
            'return_reason': getattr(order, 'return_reason', '') or '',
            'refund_amount': str(getattr(order, 'refund_amount', '0.00')),
            'refund_reference': getattr(order, 'refund_reference', '') or '',
        }

        items = []
        for it in order.items.select_related('product').all():
            items.append({
                'name': it.product.name if it.product else 'Urban Item',
                'quantity': it.quantity,
                'price': str(it.price),
                'total': str(it.get_total_price()),
            })
        order_info['items'] = items

        normalized_type = _normalize_order_status_type(status_type or order.order_status, order.payment_status)
        subject, plain_text, html_text = build_order_email_content(order_info, normalized_type, extra_note=extra_note)

        def _dispatch():
            # 1. Send to Customer (order.email)
            customer_email = order_info['email']
            ok, err = send_email(customer_email, subject, plain_text, html_text)
            if ok:
                print(f"[UrbanCart Order Mailer] Sent {normalized_type} email for Order #{order_info['id']} to customer {customer_email}")
            else:
                print(f"[UrbanCart Order Mailer Warning] Failed {normalized_type} email for Order #{order_info['id']} to {customer_email}: {err}")

            # 2. Store Admin Alert (on new order confirmation or cancel/return)
            if notify_admin and normalized_type in ('CONFIRMED', 'CANCELLED', 'RETURN_REQUESTED'):
                admin_emails = get_admin_emails()
                app_url = os.environ.get('FRONTEND_URL', 'https://urbancart-amber.vercel.app').rstrip('/')
                for adm in admin_emails:
                    if adm != customer_email:
                        adm_label = 'New Order Placed' if normalized_type == 'CONFIRMED' else normalized_type.replace('_', ' ').title()
                        adm_subject = f"🔔 [Admin Alert] {adm_label}: Order #{order_info['id']} ({order_info['full_name']} — ₹{order_info['total_amount']})"
                        adm_plain = (
                            f"UrbanCart Store Admin Alert\n"
                            f"Event: {adm_label}\n"
                            f"Order ID: #{order_info['id']}\n\n"
                            f"Customer: {order_info['full_name']} ({customer_email})\n"
                            f"Payment: {order_info['payment_method']} ({order_info['payment_status']})\n"
                            f"Amount: ₹{order_info['total_amount']}\n"
                            f"Shipping Address: {order_info['address']}, {order_info['city']} - {order_info['postal_code']}\n\n"
                            f"ITEMS:\n" + "\n".join(f"  • {it['quantity']}x {it['name']} — ₹{it['total']}" for it in items) + "\n\n"
                            f"Manage order in Admin Dashboard: {app_url}/admin\n"
                        )
                        send_email(adm, adm_subject, adm_plain, html_text)

            return ok, err

        if async_send:
            threading.Thread(target=_dispatch, daemon=True).start()
            return True, None

        return _dispatch()
    except Exception as e:
        print(f"[UrbanCart Order Mailer Error] Order #{getattr(order, 'id', '?')}: {e}")
        return False, str(e)


def send_ticket_update_email(ticket, async_send=None):
    """Notifies customer via email when support team replies to or resolves their SupportTicket."""
    user_email = getattr(getattr(ticket, 'user', None), 'email', '') or (
        getattr(getattr(ticket, 'order', None), 'email', '') if getattr(ticket, 'order', None) else ''
    )
    if not user_email or '@' not in user_email:
        return False, "No recipient email on support ticket."

    if async_send is None:
        async_send = not _should_send_sync()

    try:
        user_name = (ticket.user.first_name or ticket.user.username) if getattr(ticket, 'user', None) else 'Customer'
        app_url = os.environ.get('FRONTEND_URL', 'https://urbancart-amber.vercel.app').rstrip('/')
        subject = f"💬 Support Update (Ticket #{ticket.id}): {ticket.subject} — UrbanCart"

        plain_text = (
            f"Hi {user_name},\n\n"
            f"There is a new update on your UrbanCart Support Ticket #{ticket.id} ({ticket.status}).\n\n"
            f"Subject: {ticket.subject}\n"
            f"Support Reply:\n{ticket.admin_reply or 'Your ticket status has been updated.'}\n\n"
            f"Check your dashboard anytime: {app_url}\n\n"
            f"Team UrbanCart\n"
        )

        safe_name = html.escape(user_name)
        safe_subject = html.escape(ticket.subject)
        safe_status = html.escape(ticket.status)
        safe_reply = html.escape(ticket.admin_reply or 'Your ticket status has been updated.').replace('\n', '<br>')
        badge_color = '#059669' if ticket.status == 'Resolved' else '#2563eb'
        badge_bg = '#ecfdf5' if ticket.status == 'Resolved' else '#eff6ff'

        html_text = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
    <div style="background: #090d16; padding: 24px; text-align: center;">
      <span style="color: #ffffff; font-size: 20px; font-weight: 800;">Urban<span style="color: #f59e0b;">Cart</span> Priority Care</span>
    </div>
    <div style="padding: 28px 24px;">
      <div style="margin-bottom: 14px;">
        <span style="background: {badge_bg}; color: {badge_color}; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
          Ticket #{ticket.id} • {safe_status}
        </span>
      </div>
      <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 8px;">{safe_subject}</h2>
      <p style="font-size: 14px; color: #64748b; margin: 0 0 18px;">Hi <strong>{safe_name}</strong>, our customer care team updated your ticket:</p>
      <div style="background: #f8fafc; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 16px; font-size: 14px; color: #1e293b; line-height: 1.6;">
        {safe_reply}
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="{html.escape(app_url)}" style="display: inline-block; background: #d97706; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 11px 24px; border-radius: 9999px;">
          Open Support Desk →
        </a>
      </div>
    </div>
    <div style="background: #070b12; color: #94a3b8; font-size: 11px; text-align: center; padding: 18px;">
      © 2026 UrbanCart. Designed &amp; Developed by <strong style="color: #f59e0b;">Kalyan Dev</strong>.
    </div>
  </div>
</body>
</html>"""

        if async_send:
            def _worker():
                try:
                    send_email(user_email, subject, plain_text, html_text)
                except Exception as exc:
                    print(f"[UrbanCart Ticket Mailer Error] Ticket #{ticket.id}: {exc}")
            threading.Thread(target=_worker, daemon=True).start()
            return True, None
        return send_email(user_email, subject, plain_text, html_text)
    except Exception as e:
        return False, str(e)


def amount_to_words_inr(amount):
    """Converts numeric amount into Indian Rupee words (e.g. 5098.50 -> Five Thousand Ninety-Eight Rupees and Fifty Paise Only)."""
    try:
        dec = Decimal(str(amount)).quantize(Decimal('0.01'))
    except Exception:
        return "Zero Rupees Only"

    rupees = int(dec)
    paise = int(round((dec - Decimal(rupees)) * 100))

    if rupees <= 0 and paise <= 0:
        return "Zero Rupees Only"

    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
             "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
             "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def _two_digits(n):
        if n < 20:
            return units[n]
        return tens[n // 10] + ("-" + units[n % 10] if n % 10 != 0 else "")

    def _three_digits(n):
        h = n // 100
        rem = n % 100
        res = ""
        if h > 0:
            res += units[h] + " Hundred"
            if rem > 0:
                res += " and "
        if rem > 0:
            res += _two_digits(rem)
        return res

    parts = []
    crores = rupees // 10000000
    rupees %= 10000000
    lakhs = rupees // 100000
    rupees %= 100000
    thousands = rupees // 1000
    rupees %= 1000
    hundreds = rupees

    if crores > 0:
        parts.append(f"{_three_digits(crores)} Crore")
    if lakhs > 0:
        parts.append(f"{_two_digits(lakhs)} Lakh")
    if thousands > 0:
        parts.append(f"{_two_digits(thousands)} Thousand")
    if hundreds > 0:
        parts.append(_three_digits(hundreds))

    r_words = " ".join(parts).strip()
    result = ""
    if r_words:
        result = f"{r_words} Rupees"
    else:
        result = "Zero Rupees"

    if paise > 0:
        p_words = _two_digits(paise)
        result += f" and {p_words} Paise"

    return f"{result} Only"


def get_hsn_code_for_product(category_name):
    cat = (category_name or '').lower()
    if any(w in cat for w in ['cloth', 'apparel', 'hoodie', 'streetwear', 'shirt', 'jacket']):
        return '6109'
    elif any(w in cat for w in ['foot', 'shoe', 'sneaker', 'boot']):
        return '6404'
    elif any(w in cat for w in ['elec', 'audio', 'sound', 'headphone']):
        return '8518'
    elif any(w in cat for w in ['watch', 'wearable']):
        return '9102'
    elif any(w in cat for w in ['gaming', 'keyboard', 'mouse']):
        return '8471'
    return '9983'


def generate_tax_invoice_html(order):
    """Generates an authentic, high-resolution GST Tax Invoice HTML page formatted for print and PDF export."""
    inv_num = getattr(order, 'invoice_number', f"INV-2026-{order.id:05d}")
    date_str = order.created_at.strftime('%d %B %Y') if getattr(order, 'created_at', None) else '12 Nov 2026'
    time_str = order.created_at.strftime('%I:%M %p') if getattr(order, 'created_at', None) else ''

    safe_name = html.escape(order.full_name or 'Valued Customer')
    safe_address = html.escape(order.address or '')
    safe_city = html.escape(order.city or '')
    safe_postal = html.escape(order.postal_code or '')
    safe_email = html.escape(order.email or '')
    safe_pm = html.escape(getattr(order, 'get_payment_method_display', lambda: order.payment_method)() or order.payment_method)
    safe_ps = html.escape(order.payment_status or '')
    safe_tx = html.escape(order.transaction_id or 'TXN-AUTO-VERIFIED')

    items = list(order.items.select_related('product').all())
    subtotal_dec = Decimal('0.00')
    rows_html = ''

    for idx, it in enumerate(items, 1):
        pname = it.product.name if it.product else 'Urban Item'
        pcat = it.product.category if it.product else 'General'
        hsn = get_hsn_code_for_product(pcat)
        qty = it.quantity
        price = it.price
        line_total = it.get_total_price()
        subtotal_dec += line_total

        # 18% inclusive GST calculation: Taxable = Total / 1.18, Tax = Total - Taxable
        taxable_val = (line_total / Decimal('1.18')).quantize(Decimal('0.01'))
        tax_val = (line_total - taxable_val).quantize(Decimal('0.01'))

        rows_html += f"""
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">{idx}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 700; color: #0f172a;">{html.escape(pname)}</div>
            <div style="font-size: 11px; color: #64748b;">Category: {html.escape(pcat)}</div>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-size: 12px; color: #475569;">{hsn}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600;">{qty}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">₹{price}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">₹{taxable_val}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 12px;">₹{tax_val} <span style="font-size: 10px;">(18%)</span></td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">₹{line_total}</td>
        </tr>
        """

    total_dec = order.total_amount
    shipping_dec = max(Decimal('0.00'), total_dec - subtotal_dec) if items else Decimal('99.00')
    net_taxable_total = (subtotal_dec / Decimal('1.18')).quantize(Decimal('0.01')) if items else Decimal('0.00')
    net_gst_total = (subtotal_dec - net_taxable_total).quantize(Decimal('0.01')) if items else Decimal('0.00')
    amount_words = amount_to_words_inr(total_dec)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax Invoice #{inv_num} — UrbanCart</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      margin: 0;
      padding: 24px 16px;
    }}
    .invoice-card {{
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px 48px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    }}
    .no-print {{
      margin-bottom: 20px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }}
    .btn {{
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
    }}
    .btn-print {{
      background: #d97706;
      color: #ffffff;
    }}
    .btn-print:hover {{
      background: #b45309;
    }}
    .btn-back {{
      background: #e2e8f0;
      color: #1e293b;
    }}
    @media print {{
      body {{
        background: #ffffff !important;
        padding: 0 !important;
      }}
      .no-print {{
        display: none !important;
      }}
      .invoice-card {{
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }}
      @page {{
        margin: 12mm;
        size: A4 portrait;
      }}
    }}
  </style>
</head>
<body>

  <div class="no-print" style="max-width: 860px; margin: 0 auto 16px;">
    <button onclick="window.history.back()" class="btn btn-back">← Back</button>
    <button onclick="window.print()" class="btn btn-print">🖨️ Print / Download PDF</button>
  </div>

  <div class="invoice-card">
    <!-- Header -->
    <table style="width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px;">
      <tr>
        <td style="vertical-align: top; width: 55%;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="display: inline-block; background: #d97706; color: #ffffff; font-weight: 800; font-size: 15px; width: 32px; height: 32px; line-height: 32px; border-radius: 8px; text-align: center;">UC</span>
            <span style="font-size: 24px; font-weight: 800; color: #090d16; letter-spacing: -0.5px;">
              Urban<span style="color: #d97706;">Cart</span>
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a;">UrbanCart Retail Private Limited</div>
          <div style="font-size: 12px; color: #475569; line-height: 1.5; margin-top: 4px;">
            DLF Cyber City, Building 10, DLF Phase 2<br>
            Gurugram, Haryana - 122002, India<br>
            <strong>GSTIN:</strong> 07AAACU1234F1Z8 | <strong>CIN:</strong> U52100HR2026PTC109988<br>
            <strong>Support:</strong> care@urbancart.in | +91 1800-URBANCART
          </div>
        </td>
        <td style="vertical-align: top; text-align: right; width: 45%;">
          <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">
            ORIGINAL FOR RECIPIENT
          </div>
          <h1 style="font-size: 26px; font-weight: 800; margin: 0 0 6px; color: #0f172a; letter-spacing: -0.5px;">TAX INVOICE</h1>
          <div style="font-size: 13px; color: #475569; line-height: 1.6;">
            <strong>Invoice No:</strong> <span style="color: #d97706; font-weight: 800;">{inv_num}</span><br>
            <strong>Invoice Date:</strong> {date_str} {time_str}<br>
            <strong>Order Reference:</strong> #{order.id}<br>
            <strong>Place of Supply:</strong> {safe_city}, India (State: Haryana - 06)
          </div>
        </td>
      </tr>
    </table>

    <!-- Billing & Shipping Information -->
    <table style="width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; font-size: 13px; border-collapse: collapse;">
      <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <th style="padding: 10px 14px; text-align: left; width: 50%; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Billed &amp; Shipped To (Customer)</th>
        <th style="padding: 10px 14px; text-align: left; width: 50%; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Payment &amp; Logistics Details</th>
      </tr>
      <tr>
        <td style="padding: 14px; vertical-align: top; border-right: 1px solid #e2e8f0; line-height: 1.6;">
          <div style="font-size: 15px; font-weight: 800; color: #0f172a;">{safe_name}</div>
          <div style="color: #334155;">{safe_address}</div>
          <div style="color: #334155;">{safe_city} - {safe_postal}, India</div>
          <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Email: {safe_email}</div>
        </td>
        <td style="padding: 14px; vertical-align: top; line-height: 1.6;">
          <div><strong>Payment Mode:</strong> {safe_pm}</div>
          <div><strong>Payment Status:</strong> <span style="color: #059669; font-weight: 700;">{safe_ps}</span></div>
          <div><strong>Transaction ID:</strong> <span style="font-family: monospace;">{safe_tx}</span></div>
          <div><strong>Fulfillment Mode:</strong> UrbanCart Express Doorstep Delivery</div>
        </td>
      </tr>
    </table>

    <!-- Itemized Products Table -->
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
      <thead>
        <tr style="background: #090d16; color: #ffffff; font-size: 11px; text-transform: uppercase;">
          <th style="padding: 10px 8px; text-align: center; width: 5%;">#</th>
          <th style="padding: 10px 8px; text-align: left; width: 38%;">Description of Goods</th>
          <th style="padding: 10px 8px; text-align: center; width: 10%;">HSN Code</th>
          <th style="padding: 10px 8px; text-align: center; width: 7%;">Qty</th>
          <th style="padding: 10px 8px; text-align: right; width: 12%;">Gross Price</th>
          <th style="padding: 10px 8px; text-align: right; width: 13%;">Taxable Val</th>
          <th style="padding: 10px 8px; text-align: right; width: 15%;">GST (18% Incl.)</th>
          <th style="padding: 10px 8px; text-align: right; width: 12%;">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows_html}
      </tbody>
    </table>

    <!-- Financial Totals -->
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 28px;">
      <tr>
        <td style="width: 60%; vertical-align: top; padding-right: 24px;">
          <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">
            <strong>Amount in Words:</strong><br>
            <span style="font-size: 13px; font-weight: 700; color: #0f172a;">{amount_words}</span>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-top: 14px; font-size: 11px; color: #64748b; line-height: 1.5;">
            <strong>Terms &amp; Conditions:</strong><br>
            1. Goods once sold are covered under UrbanCart's 7-Day Hassle-Free Return / Replacement guarantee.<br>
            2. All taxes have been charged under GST rules. No extra octroi or cess payable at delivery.<br>
            3. For warranty and customer support queries, visit www.urbancart.in or write to care@urbancart.in.
          </div>
        </td>

        <td style="width: 40%; vertical-align: top;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Items Net Taxable Value:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">₹{net_taxable_total}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Integrated GST (18% Included):</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">₹{net_gst_total}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Subtotal (Inclusive of Taxes):</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">₹{subtotal_dec}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Express Shipping Charges:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">₹{shipping_dec}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a;">
              <td style="padding: 10px 0; font-size: 16px; font-weight: 800; color: #0f172a;">Grand Total Paid:</td>
              <td style="padding: 10px 0; text-align: right; font-size: 18px; font-weight: 800; color: #d97706;">₹{total_dec}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Signature & Digital Stamp -->
    <table style="width: 100%; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; margin-top: 10px;">
      <tr>
        <td style="vertical-align: middle; width: 60%; color: #64748b;">
          🔒 <strong>Digital Verification Note:</strong><br>
          This is a computer-generated tax invoice issued in accordance with the provisions of Section 31 of the CGST Act, 2017. No physical signature is required.
        </td>
        <td style="vertical-align: middle; text-align: right; width: 40%;">
          <div style="font-size: 11px; color: #475569; font-weight: 700; margin-bottom: 4px;">For UrbanCart Retail Private Limited</div>
          <div style="display: inline-block; border: 2px dashed #059669; background: #ecfdf5; border-radius: 8px; padding: 6px 14px; text-align: center;">
            <div style="font-size: 12px; font-weight: 800; color: #059669;">✓ DIGITALLY SIGNED</div>
            <div style="font-size: 10px; color: #047857;">Authorized Signatory: Kalyan Dev</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

</body>
</html>"""


