from typing import Optional, Literal, Union
from datetime import datetime
from pydantic import BaseModel, Field
from openai import OpenAI
from core.models import Service, AvailabilitySlot, Booking
from django.shortcuts import get_object_or_404
import os

"""
Event extraction and confirmation chain utilities for calendar/event requests.
"""

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
model = "gpt-4o"

# --------------------------------------------------------------
# Data models for each stage
# --------------------------------------------------------------


class EventExtraction(BaseModel):
    """First LLM call: Extract basic event information"""

    description: str = Field(description="Raw description of the event")
    is_service_event: bool = Field(
        description="Whether this text describes a calendar event"
    )
    confidence_score: float = Field(description="Confidence score between 0 and 1")


class BookingData(BaseModel):
    date: Optional[str] = Field(description="Date of the booking, ISO format")
    time: Optional[str] = Field(description="Time of the booking")
    service_id: Optional[str] = Field(description="ID of the related service")


class ServiceData(BaseModel):
    name: Optional[str] = Field(description="Name of the service")
    description: Optional[str] = Field(description="Service description")
    duration: Optional[int] = Field(description="Duration of the service in minutes")


class AvailableTimeData(BaseModel):
    start_time: Optional[str] = Field(description="Start time in ISO format")
    end_time: Optional[str] = Field(description="End time in ISO format")


class UserAction(BaseModel):
    """Model for user requested actions on booking/services/availability"""

    action: Literal["add", "update", "delete", "get_info"] = Field(
        description="Type of action user wants to perform"
    )
    target_type: Literal["available_time", "service", "booking"] = Field(
        description="The category/type to operate on"
    )
    target_id: Optional[str] = Field(
        default=None,
        description="Identifier of the target entity for update/delete actions",
    )
    data: Optional[Union[BookingData, ServiceData, AvailableTimeData]] = Field(
        default=None, description="Payload data needed for add/update actions"
    )


# --------------------------------------------------------------
# Function for get/update/create
# --------------------------------------------------------------


def get_user_services(user: object) -> dict:
    print(f"[DEBUG] Using Get User Services tool")
    qs = Service.objects.filter(user=user)
    return {
        "services": [{"id": s.id, "name": s.name, "duration": s.duration} for s in qs]
    }


def get_user_times(user: object) -> dict:
    print(f"[DEBUG] Using Get User Availability Times tool")
    qs = AvailabilitySlot.objects.filter(user=user)
    return {
        "available_times": [
            {
                "id": slot.id,
                "date": slot.date.isoformat(),
                "start_time": slot.start_time.isoformat(),
                "end_time": slot.end_time.isoformat(),
                "is_active": slot.is_active,
            }
            for slot in qs
        ]
    }


def get_user_bookings(user: object) -> dict:
    print(f"[DEBUG] Using Get User Bookings tool")
    qs = Booking.objects.filter(user=user)
    return {
        "bookings": [
            {
                "id": booking.id,
                "service": booking.service.name if booking.service else None,
                "date": booking.slot.date.isoformat() if booking.slot else None,
                "start_time": (
                    booking.start_time.isoformat() if booking.start_time else None
                ),
                "end_time": booking.end_time.isoformat() if booking.end_time else None,
                "customer_name": booking.customer_name,
                "status": booking.status,
            }
            for booking in qs
        ]
    }


def add_service(user: object) -> bool:
    pass


tool_schemas = [
    {
        "name": "get_user_services",
        "type": "python_function",
        "description": "Get all services available for a specific user",
        "parameters": {
            "type": "object",
            "properties": {"user": {"type": "object", "description": "User object"}},
            "required": ["user"],
        },
    },
    {
        "name": "get_user_times",
        "type": "python_function",
        "description": "Get all availability times for a specific user",
        "parameters": {
            "type": "object",
            "properties": {"user": {"type": "object", "description": "User object"}},
            "required": ["user"],
        },
    },
    {
        "name": "get_user_bookings",
        "type": "python_function",
        "description": "Get all bookings for a specific user ( User is the one who does the job )",
        "parameters": {
            "type": "object",
            "properties": {"user": {"type": "object", "description": "User object"}},
            "required": ["user"],
        },
    },
]


# --------------------------------------------------------------
# Functions for each stage
# --------------------------------------------------------------


def extract_event_info(user_input: str) -> EventExtraction:
    """First LLM call to determine if input is a calendar event"""
    print("[INFO] Starting event extraction analysis")
    print(f"[DEBUG] Input text: {user_input}")
    today = datetime.now()
    date_context = f"Today is {today.strftime('%A, %B %d, %Y')}."
    completion = client.beta.chat.completions.parse(
        model=model,
        messages=[
            {
                "role": "system",
                "content": f"{date_context} Analyze if the text describes: Clients asking about his details(Services/Bookings/Available Times). User can ask to update it or perform other actions",
            },
            {"role": "user", "content": user_input},
        ],
        response_format=EventExtraction,
    )
    result = completion.choices[0].message.parsed
    print(
        f"[INFO] Extraction complete - Is calendar event: {result.is_service_event}, Confidence: {result.confidence_score:.2f}"
    )
    return result


def parse_details(description: str) -> UserAction:
    """Second LLM call to extract type, action, and other details"""
    print("[INFO] Starting parsing details")
    today = datetime.now()
    date_context = f"Today is {today.strftime('%A, %B %d, %Y')}."
    completion = client.beta.chat.completions.parse(
        model=model,
        messages=[
            {
                "role": "system",
                "content": f"{date_context} Extract detailed event information. When dates reference 'next Tuesday' or similar relative dates, use this current date as reference.",
            },
            {"role": "user", "content": description},
        ],
        response_format=UserAction,
    )
    result = completion.choices[0].message.parsed
    return result


def process_calendar_request(user_input: str, user: object) -> Optional[str]:
    """Main function implementing the prompt chain with gate check"""
    print("[INFO] Processing calendar request")
    print(f"[DEBUG] Raw input: {user_input}")

    # First LLM call: Extract basic info
    initial_extraction = extract_event_info(user_input)

    # Gate check: Verify if it's a service-related event with sufficient confidence
    if (
        not initial_extraction.is_service_event
        or initial_extraction.confidence_score < 0.7
    ):
        print(
            f"[WARNING] Gate check failed - is_service_event: {initial_extraction.is_service_event}, confidence: {initial_extraction.confidence_score:.2f}"
        )
        return "Sorry, I couldn't understand your request."

    print("[INFO] Gate check passed, proceeding with event processing")

    # Second LLM call: Get detailed event information (user action)
    event_details = parse_details(initial_extraction.description)

    # Handle actions based on user intent
    if event_details.action == "get_info":
        if event_details.target_type == "service":
            services = get_user_services(user)
            service_names = [s["name"] for s in services.get("services", [])]
            return f"You currently have these services: {', '.join(service_names)}"

        elif event_details.target_type == "available_time":
            times_data = get_user_times(user)
            time_slots = times_data.get("available_times", [])
            if not time_slots:
                return "You have no available times set."

            formatted_times = [
                f"{slot['date']} from {slot['start_time'][:5]} to {slot['end_time'][:5]}"
                for slot in time_slots
            ]
            return f"You currently have these availability times: {'; '.join(formatted_times)}."

        elif event_details.target_type == "booking":
            bookings_data = get_user_bookings(user)
            bookings = bookings_data.get("bookings", [])
            if not bookings:
                return "You have no bookings."
            formatted_bookings = [
                f"{b['date']} {b['start_time'][:5]}-{b['end_time'][:5]}: {b['service']} for {b['customer_name']} (status: {b['status']})"
                for b in bookings
            ]
            return (
                f"You currently have these bookings: {'; '.join(formatted_bookings)}."
            )

    elif event_details.action == "add":
        # Example for add service (implement add_service function)
        if event_details.target_type == "service" and event_details.data:
            result = add_service(user.id, event_details.data)
            return f"Service '{result.name}' was added successfully."
        # Similarly for booking, available_time

    elif event_details.action == "update":
        # Implement update logic
        return "Update action is not implemented yet."

    elif event_details.action == "delete":
        # Implement delete logic
        return "Delete action is not implemented yet."

    return None
