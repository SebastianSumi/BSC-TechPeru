import type { SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select {...props} className={['bsc-select', className].filter(Boolean).join(' ')}>
      {children}
    </select>
  )
}
