import json
import os
import urllib.request
import urllib.error
from django.conf import settings
from django.core.mail import send_mail


def generate_otp_email_html(otp):
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
          {otp}
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
    """Dispatches OTP via Google Apps Script / HTTPS webhook over port 443."""
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
    """Dispatches OTP via Brevo HTTPS REST API (Port 443, never blocked by Render free tier)."""
    payload = json.dumps({
        'sender': {'name': 'UrbanCart', 'email': sender_email or 'noreply@urbancart.com'},
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
            raise RuntimeError(f"Brevo returned HTTP {resp.status}")


def _send_via_resend(api_key, sender_email, email, subject, plain_text, html_text):
    """Dispatches OTP via Resend HTTPS REST API (Port 443)."""
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
    with urllib.request.urlopen(req, timeout=8) as resp:
        if resp.status >= 400:
            raise RuntimeError(f"Resend returned HTTP {resp.status}")


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
    from_email = getattr(settings, 'EMAIL_HOST_USER', '') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'UrbanCart <noreply@urbancart.com>')

    # 1. HTTPS Webhook (e.g. Google Apps Script Web App over port 443)
    webhook_url = os.environ.get('EMAIL_WEBHOOK_URL', '').strip()
    if webhook_url:
        try:
            _send_via_webhook(webhook_url, email, subject, plain_text, html_text)
            return True, None
        except Exception as e:
            return False, f"Webhook delivery error: {e}"

    # 2. Brevo HTTP REST API (300 free emails/day over port 443)
    brevo_key = os.environ.get('BREVO_API_KEY', '').strip()
    if brevo_key:
        try:
            _send_via_brevo(brevo_key, getattr(settings, 'EMAIL_HOST_USER', ''), email, subject, plain_text, html_text)
            return True, None
        except Exception as e:
            return False, f"Brevo API error: {e}"

    # 3. Resend HTTP REST API (over port 443)
    resend_key = os.environ.get('RESEND_API_KEY', '').strip()
    if resend_key:
        try:
            _send_via_resend(resend_key, getattr(settings, 'RESEND_FROM_EMAIL', ''), email, subject, plain_text, html_text)
            return True, None
        except Exception as e:
            return False, f"Resend API error: {e}"

    # 4. Standard SMTP fallback (works locally; Render free tier blocks ports 25/465/587)
    try:
        send_mail(
            subject=subject,
            message=plain_text,
            from_email=from_email,
            recipient_list=[email],
            html_message=html_text,
            fail_silently=False
        )
        return True, None
    except Exception as e:
        err_str = str(e)
        if 'timed out' in err_str.lower() or '101' in err_str or 'network is unreachable' in err_str.lower():
            return False, (
                "Render Free tier blocks outbound SMTP port 587. "
                "Add EMAIL_WEBHOOK_URL (Google Apps Script) or BREVO_API_KEY in Render Environment Variables for instant HTTPS email delivery."
            )
        return False, err_str
