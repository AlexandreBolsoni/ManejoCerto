import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type BaseFieldProps = {
  label: string
}

export type TextFieldProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement>
export type SelectFieldProps = BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement>
export type TextAreaFieldProps = BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextField({ label, ...props }: TextFieldProps) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  )
}

export function SelectField({ label, ...props }: SelectFieldProps) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <select {...props} />
    </label>
  )
}

export function TextAreaField({ label, ...props }: TextAreaFieldProps) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <textarea {...props} />
    </label>
  )
}
