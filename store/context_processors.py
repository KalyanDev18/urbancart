from django.conf import settings

def clerk_context(request):
    """
    Exposes Clerk Auth API publishable key and brand context to all Django templates.
    """
    return {
        'BRAND_NAME': 'UrbanCart',
        'CLERK_PUBLISHABLE_KEY': getattr(settings, 'CLERK_PUBLISHABLE_KEY', ''),
    }
