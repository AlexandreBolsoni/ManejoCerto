import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestoreDb } from '../lib/firebase'
import type { Field } from '../types'
import { withoutUndefined } from '../utils/firestoreData'

function storageKey(userId: string, farmId: string) {
  return `nimbo:${userId}:${farmId}:fields`
}

function isSeedField(field: Field) {
  return ['norte', 'sul', 'leste'].includes(field.id) || field.name.startsWith('Talhão ') || field.name === 'Várzea Leste'
}

async function listFields(userId?: string, farmId?: string) {
  if (!userId || !farmId) return []

  const stored = localStorage.getItem(storageKey(userId, farmId))
  const localFields = stored ? (JSON.parse(stored) as Field[]).filter((field) => !isSeedField(field)) : []

  if (!firestoreDb || userId === 'demo-user') return localFields

  return getDocs(collection(firestoreDb, 'users', userId, 'farms', farmId, 'fields'))
    .then((snapshot) => {
      const fields = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Field).filter((field) => !isSeedField(field))
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
    localStorage.setItem(storageKey(userId, farmId), JSON.stringify(nextFields))

    if (firestoreDb && userId !== 'demo-user') {
      await setDoc(doc(firestoreDb, 'users', userId, 'farms', farmId, 'fields', field.id), {
        ...withoutUndefined(field),
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch((error: unknown) => {
        console.warn('Nao foi possivel salvar a area no Firestore. Mantendo copia local.', error)
      })
    }

    return field
  },

  async deleteField(userId: string, farmId: string, fieldId: string) {
    const fields = await listFields(userId, farmId)
    localStorage.setItem(storageKey(userId, farmId), JSON.stringify(fields.filter((item) => item.id !== fieldId)))

    if (firestoreDb && userId !== 'demo-user') {
      await deleteDoc(doc(firestoreDb, 'users', userId, 'farms', farmId, 'fields', fieldId)).catch((error: unknown) => {
        console.warn('Nao foi possivel apagar a area no Firestore. Removendo copia local.', error)
      })
    }
  },

  clearFarmFields(userId: string, farmId: string) {
    localStorage.removeItem(storageKey(userId, farmId))
  },
}
