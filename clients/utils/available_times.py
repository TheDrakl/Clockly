from datetime import datetime, timedelta
from ..models import AvailabilitySlot, UnavailableSlot, Booking

def generate_available_times(user, date, service_duration):
    # Get all availability blocks (like 10:00–15:00) for that day
    avail_slots = AvailabilitySlot.objects.filter(user=user, date=date, is_active=True)

    # Get all bookings for that user and day
    bookings = Booking.objects.filter(user=user, slot__date=date)

    # Get unavailable breaks (like lunch)
    breaks = UnavailableSlot.objects.filter(user=user, date=date)

    available_times = []

    for slot in avail_slots:
        slot_start = datetime.combine(slot.date, slot.start_time)
        slot_end = datetime.combine(slot.date, slot.end_time)
        current = slot_start

        while current + service_duration <= slot_end:
            current_end = current + service_duration
            overlap = False

            # Check overlap with bookings
            for booking in bookings:
                b_start = datetime.combine(slot.date, booking.start_time)
                b_end = b_start + booking.service.duration
                if not (current_end <= b_start or current >= b_end):
                    overlap = True
                    break

            # Check overlap with unavailable slots
            for brk in breaks:
                u_start = datetime.combine(brk.date, brk.start_time)
                u_end = datetime.combine(brk.date, brk.end_time)
                if not (current_end <= u_start or current >= u_end):
                    overlap = True
                    break

            if not overlap:
                available_times.append({
                    "start_time": current.time(),
                    "end_time": current_end.time()
                })

            current += timedelta(minutes=30)

    return available_times
