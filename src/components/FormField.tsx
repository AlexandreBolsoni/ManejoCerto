import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type BaseProps = {
  label: string
}

export function TextField({ label, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  )
}

export function SelectField({ label, ...props }: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <select {...props} />
    </label>
  )
}

export function TextAreaField({ label, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <textarea {...props} />
    </label>
  )
}
