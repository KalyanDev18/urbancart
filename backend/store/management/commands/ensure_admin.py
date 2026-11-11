import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = (
        "Idempotently creates or promotes admin/superuser accounts from environment variables "
        "(DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_PASSWORD, ADMIN_EMAILS)."
    )

    def handle(self, *args, **options):
        su_username = os.environ.get('DJANGO_SUPERUSER_USERNAME', '').strip()
        su_email = os.environ.get('DJANGO_SUPERUSER_EMAIL', '').strip().lower()
        su_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')

        if su_password and (su_username or su_email):
            user = None
            if su_username:
                user = User.objects.filter(username=su_username).first()
            if not user and su_email:
                user = User.objects.filter(email__iexact=su_email).first()

            if user:
                updated_fields = []
                if su_email and user.email.lower() != su_email:
                    user.email = su_email
                    updated_fields.append('email')
                if not user.is_staff:
                    user.is_staff = True
                    updated_fields.append('is_staff')
                if not user.is_superuser:
                    user.is_superuser = True
                    updated_fields.append('is_superuser')
                user.set_password(su_password)
                updated_fields.append('password')
                user.save(update_fields=updated_fields)
                self.stdout.write(self.style.SUCCESS(f"Updated superuser '{user.username}'."))
            else:
                base_name = su_username or su_email.split('@')[0] or 'admin'
                cleaned = ''.join(c for c in base_name if c.isalnum() or c in '_-.')[:30] or 'admin'
                User.objects.create_superuser(
                    username=cleaned,
                    email=su_email,
                    password=su_password,
                )
                self.stdout.write(self.style.SUCCESS(f"Created superuser '{cleaned}'."))

        raw_admin_emails = os.environ.get('ADMIN_EMAILS', '')
        admin_emails = [e.strip().lower() for e in raw_admin_emails.split(',') if e.strip()]
        for admin_email in admin_emails:
            user = User.objects.filter(email__iexact=admin_email).first()
            if user:
                if not user.is_staff or not user.is_superuser:
                    user.is_staff = True
                    user.is_superuser = True
                    user.save(update_fields=['is_staff', 'is_superuser'])
                    self.stdout.write(self.style.SUCCESS(f"Promoted '{admin_email}' to admin."))
            else:
                base = ''.join(c for c in admin_email.split('@')[0] if c.isalnum() or c in '_-')[:20] or 'admin'
                candidate = base
                counter = 1
                while User.objects.filter(username=candidate).exists():
                    candidate = f"{base}_{counter}"
                    counter += 1
                user = User.objects.create_user(
                    username=candidate,
                    email=admin_email,
                    first_name=candidate.capitalize(),
                )
                user.set_unusable_password()
                user.is_staff = True
                user.is_superuser = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created OTP admin account for '{admin_email}'."))
