import { useEffect, useRef, useState } from 'react'
import '../styles/components/DataUsageTracker.css'

const KB_PER_SECOND = 150 / 60 // ~2.5 KB
const WARNING_KB = 500
const DANGER_KB = 1200

const DataUsageTracker = ({ isActive, isPaused }) => {
  const [estimatedKB, setEstimatedKB] = useState(0)
  const [peakKB, setPeakKB] = useState(0)
  const startTimeRef = useRef(null)
  const accumulatedMsRef = useRef(0)

  useEffect(() => {
    if (!isActive) {
      startTimeRef.current = null
      accumulatedMsRef.current = 0
      return undefined
    }

    if (isPaused) {
      if (startTimeRef.current) {
        accumulatedMsRef.current += Date.now() - startTimeRef.current
        startTimeRef.current = null
      }
      return undefined
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    const interval = setInterval(() => {
      const elapsedMs =
        accumulatedMsRef.current +
        (startTimeRef.current ? Date.now() - startTimeRef.current : 0)
      const kb = ((elapsedMs / 1000) * KB_PER_SECOND).toFixed(1)
      const numericKB = Number(kb)
      setEstimatedKB(numericKB)
      setPeakKB((prev) => Math.max(prev, numericKB))
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isPaused])

  const getStatusClass = () => {
    if (estimatedKB >= DANGER_KB) return 'danger'
    if (estimatedKB >= WARNING_KB) return 'warning'
    return 'safe'
  }

  return (
    <div className={`data-usage data-usage--${getStatusClass()}`}>
      <div>
        <p className="data-usage__label">Estimated data used</p>
        <p className="data-usage__value">{estimatedKB.toFixed(1)} KB</p>
      </div>
      <div>
        <p className="data-usage__label">Peak during session</p>
        <p className="data-usage__value">{peakKB.toFixed(1)} KB</p>
      </div>
      <div>
        <p className="data-usage__label">Status</p>
        <p className="data-usage__value">{getStatusClass().toUpperCase()}</p>
      </div>
    </div>
  )
}

export default DataUsageTracker
