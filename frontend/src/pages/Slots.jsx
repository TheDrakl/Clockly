import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

function Slots() {
    const { username } = useParams()
    const [slots, setSlots] = useState([])
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/bookings/slots/${username}/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setSlots(data)
                } else {
                    setError('Failed to fetch slots')
                }
            } catch (error) {
                setError('Error fetching slots')
                console.error(error)
            }
        }

        fetchSlots()
    }, [username])

    if (error) {
        return (
            <div className="p-4 text-red-500">
                {error}
            </div>
        )
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Available Slots</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot) => (
                    <div key={slot.id} className="bg-white p-4 rounded-lg shadow">
                        <p className="font-medium">Date: {slot.date}</p>
                        <p>Start Time: {slot.start_time}</p>
                        <p>End Time: {slot.end_time}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Slots
