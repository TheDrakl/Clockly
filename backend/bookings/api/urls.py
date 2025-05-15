from django.urls import path
from .views import AvailableTimesView, BookTimeView, ServicesListAPIView

urlpatterns = [
    path("services/<str:user_slug>/", ServicesListAPIView.as_view(), name='services'),
    path("<str:user_slug>/<int:service_id>/<str:date>/", AvailableTimesView.as_view()),
    path("<str:user_slug>/<str:date>/", AvailableTimesView.as_view(), name="available-times-no-service"),
    path("book/<str:user_slug>/<int:service_id>/<str:date>/", BookTimeView.as_view(), name='book-appointment'),

]
