import type { Field } from '../types'
import { fieldRepository } from './firebase'
import { localStorageAdapter } from './storage'

function storageKey(userId: string, farmId: string) {
  return `nimbo:${userId}:${farmId}:fields`
}

function isSeedField(field: Field) {
  return ['norte', 'sul', 'leste'].includes(field.id) || field.name.startsWith('Talhão ') || field.name === 'Várzea Leste'
}

async function listFields(userId?: string, farmId?: string) {
  if (!userId || !farmId) return []

  const stored = localStorageAdapter.getJson<Field[]>(storageKey(userId, farmId))
  const localFields = stored ? stored.filter((field) => !isSeedField(field)) : []

  return fieldRepository
    .listByFarm(userId, farmId)
    .then((snapshot) => {
      const fields = snapshot.filter((field) => !isSeedField(field))
      return fields.length > 0 ? fields : localFields
    })
    .catch((error: unknown) => {
      console.warn('Nao foi possivel carregar areas do Firestore. Usando copia local.', error)
      return localFields
    })
}

export const fieldService = {
  listFields,

  async saveField(userId: string, farmId: string, field: Field) {
    const fields = await listFields(userId, farmId)
    const nextFields = [...fields.filter((item) => item.id !== field.id), field]
    localStorageAdapter.setJson(storageKey(userId, farmId), nextFields)

    await fieldRepository.save(userId, farmId, field).catch((error: unknown) => {
      console.warn('Nao foi possivel salvar a area no Firestore. Mantendo copia local.', error)
    })

    return field
  },

  async deleteField(userId: string, farmId: string, fieldId: string) {
    const fields = await listFields(userId, farmId)
    localStorageAdapter.setJson(storageKey(userId, farmId), fields.filter((item) => item.id !== fieldId))

    await fieldRepository.delete(userId, farmId, fieldId).catch((error: unknown) => {
      console.warn('Nao foi possivel apagar a area no Firestore. Removendo copia local.', error)
    })
  },

  clearFarmFields(userId: string, farmId: string) {
    localStorageAdapter.removeItem(storageKey(userId, farmId))
  },
}
