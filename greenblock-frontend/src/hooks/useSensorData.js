import { useEffect, useState } from 'react'
import { getSensors } from '../utils/api'

export default function useSensorData(intervalMs = 5000) {
	const [data, setData] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		let timer = null
		let cancelled = false

		const fetchData = async () => {
			try {
				const res = await getSensors()
				if (!cancelled) {
					setData(res.data)
					setError(null)
					setLoading(false)
				}
			} catch (err) {
				if (!cancelled) {
					setError(err)
					setLoading(false)
				}
			}
		}

		fetchData()
		timer = setInterval(fetchData, intervalMs)

		return () => {
			cancelled = true
			if (timer) clearInterval(timer)
		}
	}, [intervalMs])

	return { data, loading, error }
}
