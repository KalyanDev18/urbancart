import os
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
    <!-- Header -->
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

    <!-- Body -->
    <div style="padding: 36px 28px; text-align: center;">
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
        Your Login Verification Code
      </h2>
      <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
        Use the 6-digit One-Time Password (OTP) below to securely log into your UrbanCart account.
      </p>

      <!-- OTP Box -->
      <div style="background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 14px; padding: 20px 24px; margin: 20px auto; display: inline-block;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 12px; color: #b45309; display: block; margin-left: 12px;">
          {otp}
        </span>
      </div>

      <div style="font-size: 13px; color: #64748b; margin-top: 14px;">
        ⏳ This code will expire in <strong style="color: #0f172a;">10 minutes</strong>.
      </div>

      <!-- Security Notice -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-top: 28px; text-align: left; font-size: 12px; color: #475569; line-height: 1.5;">
        🔒 <strong>Security Tip:</strong> Never share this OTP with anyone, including UrbanCart representatives. If you did not request this code, you can safely ignore this email.
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #070b12; color: #94a3b8; font-size: 11px; text-align: center; padding: 22px 20px; line-height: 1.6; border-top: 1px solid #1e293b;">
      © 2026 UrbanCart. All Rights Reserved.<br>
      Designed &amp; Developed with ❤️ by <strong style="color: #f59e0b;">Kalyan Dev</strong>.
    </div>
  </div>
</body>
</html>"""


def send_otp_email(email, otp):
    """
    Dispatches styled OTP email to recipient via Django send_mail.
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
        return False, str(e)
