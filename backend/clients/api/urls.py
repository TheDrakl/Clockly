from django.urls import path
from .views import ServiceListCreateAPIView, ServiceRetrieveUpdateDestroyAPIVIew, AvailabilitySlotListCreateAPIView, AvailabilitySlotRetrieveUpdateDestroyAPIVIew, BookingSlotListCreateAPIView, BookingRetrieveUpdateDestroyAPIVIew, DashboardAPIView, BookingSlotClientListCreateAPIView


urlpatterns = [
    # Services
    path('services/', ServiceListCreateAPIView.as_view(), name='services'),
    path('services/<int:id>/', ServiceRetrieveUpdateDestroyAPIVIew.as_view(), name='service-detail'),

    # Availability Slots
    path('availability-slots/', AvailabilitySlotListCreateAPIView.as_view(), name='slots'),
    path('availability-slots/<int:id>/', AvailabilitySlotRetrieveUpdateDestroyAPIVIew.as_view(), name='slot-detail'),

    # Booking
    path('bookings/', BookingSlotClientListCreateAPIView.as_view(), name='bookings'),
    path('bookings/<int:id>/', BookingRetrieveUpdateDestroyAPIVIew.as_view(), name='booking-detai;'),

    # Dashboard 
    path('me/', DashboardAPIView.as_view(), name='dashboard')

]