from django.urls import path
from .views import AvailableTimesView, BookTimeView, ServicesListAPIView

urlpatterns = [
    path("services/<str:username>/", ServicesListAPIView.as_view(), name='services'),
    path("<str:username>/<int:service_id>/<str:date>/", AvailableTimesView.as_view()),
    path("<str:username>/<str:date>/", AvailableTimesView.as_view(), name="available-times-no-service"),
    path("book/<str:username>/<int:service_id>/<str:date>/", BookTimeView.as_view(), name='book-appointment'),

]
