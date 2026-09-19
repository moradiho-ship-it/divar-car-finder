def selected_values(profile, plural, singular):
    """Use multi selections while retaining searches created before the migration."""
    values = getattr(profile, plural, None)
    if isinstance(values, list) and values:
        return values
    old_value = getattr(profile, singular, "")
    return [old_value] if old_value else []
