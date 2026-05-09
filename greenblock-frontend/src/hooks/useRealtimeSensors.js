import { useState, useEffect, useRef, useCallback } from 'react'

function buildWsBase() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.replace(/\/$/, '')
  }
  const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '')
  if (apiUrl) {
    return apiUrl.replace(/^https/, 'wss').replace(/^http/, 'ws')
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.hostname}:8000`
}

export function useRealtimeSensors() {
  const [sensorData, setSensorData] = useState(null)
  const [connected, setConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const wsRef = useRef(null)
  const timerRef = useRef(null)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    try {
      const ws = new WebSocket(`${buildWsBase()}/ws/sensors`)
      wsRef.current = ws

      ws.onopen = () => {
        if (mountedRef.current) setConnected(true)
      }

      ws.onmessage = ({ data: raw }) => {
        if (!mountedRef.current) return
        try {
          const msg = JSON.parse(raw)
          if (msg.type === 'ping') return
          setSensorData(msg)
          setLastUpdated(new Date())
        } catch { /* ignore malformed frames */ }
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnected(false)
        timerRef.current = setTimeout(connect, 5000)
      }

      ws.onerror = () => ws.close()
    } catch { /* ignore connection failures */ }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { sensorData, connected, lastUpdated }
}
