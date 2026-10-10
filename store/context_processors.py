def store_context(request):
    """
    Exposes brand context to all Django templates.
    """
    return {
        'BRAND_NAME': 'UrbanCart',
    }
