'use client'

import { useEffect, useState, useRef } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
}

export default function AnimatedNumber({ value, duration = 1500, className = '' }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValueRef = useRef(0)

  useEffect(() => {
    if (value === prevValueRef.current) return
    
    const startValue = prevValueRef.current
    const endValue = value
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // 使用缓动函数
      const easeOutExpo = 1 - Math.pow(2, -10 * progress)
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOutExpo)
      
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValueRef.current = endValue
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span className={`inline-block tabular-nums ${className}`}>
      {displayValue.toLocaleString()}
    </span>
  )
}