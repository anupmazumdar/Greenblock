import { useEffect, useState } from 'react'
import { getRfidLog } from '../utils/api'

export default function RfidAccessLog() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    getRfidLog().then((res) => setRows(res.data.data || [])).catch(() => setRows([]))
  }, [])

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-2">RFID Access Log</h3>
      {rows.length === 0 ? (
        <p className="text-slate-400 text-sm">No access logs yet.</p>
      ) : (
        <p className="text-slate-400 text-sm">Entries: {rows.length}</p>
      )}
    </div>
  )
}
