from django.conf import settings

def clerk_context(request):
    """
    Exposes Clerk Auth API publishable key to all Django templates.
    """
    return {
        'CLERK_PUBLISHABLE_KEY': getattr(settings, 'CLERK_PUBLISHABLE_KEY', ''),
    }
