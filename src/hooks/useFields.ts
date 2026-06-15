import { useMemo } from 'react'
import { useAppData } from './useAppData'

export function useFields() {
  const { activeFieldId, addField, deleteField, fields, setActiveFieldId } = useAppData()

  return useMemo(
    () => ({
      activeField: activeFieldId ? fields.find((field) => field.id === activeFieldId) ?? null : null,
      activeFieldId,
      addField,
      deleteField,
      fields,
      highRiskFields: fields.filter((field) => field.riskLevel === 'alto' || field.riskLevel === 'critico'),
      setActiveFieldId,
      userCrops: Array.from(new Set(fields.map((field) => field.crop))),
    }),
    [activeFieldId, addField, deleteField, fields, setActiveFieldId],
  )
}
