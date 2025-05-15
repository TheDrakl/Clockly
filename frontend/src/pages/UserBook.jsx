import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import api from '../api/api'

function UserBook() {
    const { user_slug } = useParams()
    const [services, setServices] = useState([])
    const [errorMessage, setErrorMessage] = useState('')
    const [activeService, setActiveService] = useState(null)
    const [selectedDate, setSelectedDate] = useState(null)
    const [isDateSelection, setIsDateSelection] = useState(false)
    const [availableSlots, setAvailableSlots] = useState([])
    const [isLoadingSlots, setIsLoadingSlots] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [bookingForm, setBookingForm] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        notes: ''
    })
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const getServices = async () => {
            try {
                const response = await api.get(`/api/bookings/services/${user_slug}/`)
                setServices(response.data)
            } catch (error) {
                setErrorMessage('Error fetching services. Try again later')
                console.log(error)
            }
        }

        getServices()
    }, [user_slug])

    const handleServiceClick = (service) => {
        setActiveService(service.id)
    }

    const handleContinue = async () => {
        if (selectedDate) {
            setIsLoadingSlots(true)
            try {
                const formattedDate = selectedDate.toLocaleDateString('en-CA')
                const response = await api.get(`/api/bookings/${user_slug}/${activeService}/${formattedDate}/`)

                if (response.data.length === 0) {
                    setErrorMessage('No available slots for this date. Please choose another date.')
                    setAvailableSlots([])
                } else {
                    setErrorMessage('')
                    setAvailableSlots(response.data)
                    setIsDateSelection(false)
                }
            } catch (error) {
                setErrorMessage('Error fetching available slots')
                console.error(error)
            } finally {
                setIsLoadingSlots(false)
            }
        } else {
            setIsDateSelection(true)
        }
    }

    const handleDateChange = (date) => {
        setSelectedDate(date)
    }

    const handleBack = () => {
        if (availableSlots.length > 0) {
            setAvailableSlots([])
            setIsDateSelection(true)
        } else if (isDateSelection) {
            setIsDateSelection(false)
            setSelectedDate(null)
        } else {
            setActiveService(null)
        }
    }

    const handleSlotClick = (slot) => {
        setSelectedSlot(slot)
    }

    const handleBookingFormChange = (e) => {
        const { name, value } = e.target
        setBookingForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleBookingSubmit = async (e) => {
        e.preventDefault()
        try {
            const formattedDate = selectedDate.toLocaleDateString('en-CA')
            const response = await api.post(`/api/bookings/book/${user_slug}/${activeService}/${formattedDate}/`, {
                slot: selectedSlot.id,
                start_time: selectedSlot.start_time,
                end_time: selectedSlot.end_time,
                customer_name: bookingForm.customer_name,
                customer_email: bookingForm.customer_email,
                customer_phone: bookingForm.customer_phone || '',
                note: bookingForm.notes || null,
                confirmed: true
            })

            if (response.status === 201) {
                setSuccess(true)
                setErrorMessage('')
                setSelectedSlot(null)
                setBookingForm({
                    customer_name: '',
                    customer_email: '',
                    customer_phone: '',
                    notes: ''
                })
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Error creating booking')
            console.error(error)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {errorMessage && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{errorMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!isDateSelection && !availableSlots.length && services.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900">Select a Service</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {services.map((service) => (
                                <div
                                    key={service.id}
                                    className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer
                                        ${activeService === service.id ? 'ring-2 ring-indigo-500' : ''}`}
                                    onClick={() => handleServiceClick(service)}
                                >
                                    {service.featured_img && (
                                        <div className="aspect-w-16 aspect-h-9">
                                            <img 
                                                className="w-full h-48 object-cover" 
                                                src={service.featured_img} 
                                                alt={service.name} 
                                            />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                                        <p className="mt-2 text-gray-600">{service.description}</p>
                                        <div className="mt-4 flex justify-between items-center">
                                            <span className="text-lg font-medium text-indigo-600">${service.price}</span>
                                            <span className="text-sm text-gray-500">{service.duration} min</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleContinue}
                                disabled={activeService === null}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {isDateSelection && !availableSlots.length && (
                    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose a Date</h2>
                        <div className="space-y-6">
                            <div className="border rounded-lg p-4 items-center text-center">
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={handleDateChange}
                                    minDate={new Date()}
                                    inline
                                    className="w-full"
                                />
                            </div>
                            <div className="flex justify-between">
                                <button
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    onClick={handleBack}
                                >
                                    Back
                                </button>
                                <button
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleContinue}
                                    disabled={!selectedDate || isLoadingSlots}
                                >
                                    {isLoadingSlots ? 'Loading...' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!success && availableSlots.length > 0 && !selectedSlot && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Time Slots</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {availableSlots.map((slot, index) => (
                                <div
                                    key={index}
                                    className="bg-white p-4 rounded-lg shadow-sm text-center cursor-pointer hover:bg-indigo-50 transition-colors duration-200"
                                    onClick={() => handleSlotClick(slot)}
                                >
                                    <p className="text-lg font-medium text-gray-900">
                                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6">
                            <button
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                onClick={handleBack}
                            >
                                Back to Date Selection
                            </button>
                        </div>
                    </div>
                )}

                {selectedSlot && (
                    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Your Appointment</h2>
                        <form onSubmit={handleBookingSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name *</label>
                                <input
                                    type="text"
                                    name="customer_name"
                                    value={bookingForm.customer_name}
                                    onChange={handleBookingFormChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                    maxLength={50}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email *</label>
                                <input
                                    type="email"
                                    name="customer_email"
                                    value={bookingForm.customer_email}
                                    onChange={handleBookingFormChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input
                                    type="tel"
                                    name="customer_phone"
                                    value={bookingForm.customer_phone}
                                    onChange={handleBookingFormChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    maxLength={20}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea
                                    name="notes"
                                    value={bookingForm.notes}
                                    onChange={handleBookingFormChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setSelectedSlot(null)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Back to Slots
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {success && (
                    <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4l5-5-1.414-1.414L9 11.172l-1.586-1.586L6 11l3 3z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">Booking successful! 🎉</p>
                            </div>
                        </div>
                    </div>
                )}

                {services.length === 0 && !isDateSelection && !availableSlots.length && (
                    <div className="text-center py-12">
                        <p className="text-lg text-gray-600">No services found. Please try again later.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserBook