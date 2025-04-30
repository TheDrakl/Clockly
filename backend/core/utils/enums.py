from django.db.models import TextChoices

class Weekday(TextChoices):
    MONDAY = 'Mon', 'Monday'
    TUESDAY = 'Tue', 'Tuesday'
    WEDNESDAY = 'Wed', 'Wednesday'
    THURSDAY = 'Thu', 'Thursday'
    FRIDAY = 'Fri', 'Friday'
    SATURDAY = 'Sat', 'Saturday'
    SUNDAY = 'Sun', 'Sunday'