import { supabase } from '@/lib/supabase'
import { createTimeoutSignal, toApiError } from '@/utils/timeout'
import type { Owner, Category, Department } from '@/types'

export async function fetchActiveOwners(): Promise<Owner[]> {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from('active_owners').select('*').order('owner_name').abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to load owners')
    return (data ?? []) as Owner[]
  } catch (e) {
    throw toApiError(e, 'Failed to load owners')
  } finally {
    clear()
  }
}

export async function fetchActiveCategories(): Promise<Category[]> {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from('active_categories').select('*').order('category_name').abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to load categories')
    return (data ?? []) as Category[]
  } catch (e) {
    throw toApiError(e, 'Failed to load categories')
  } finally {
    clear()
  }
}

export async function fetchActiveDepartments(): Promise<Department[]> {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from('active_departments').select('*').order('department_name').abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to load departments')
    return (data ?? []) as Department[]
  } catch (e) {
    throw toApiError(e, 'Failed to load departments')
  } finally {
    clear()
  }
}

export async function createOwner(payload: Omit<Owner, 'owner_id' | 'is_active'>) {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from('owners').insert(payload).select().single().abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to create owner')
    return data as Owner
  } catch (e) {
    throw toApiError(e, 'Failed to create owner')
  } finally {
    clear()
  }
}

export async function updateOwner(ownerId: string, payload: Partial<Omit<Owner, 'owner_id'>>) {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from('owners').update(payload).eq('owner_id', ownerId).select().single().abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to update owner')
    return data as Owner
  } catch (e) {
    throw toApiError(e, 'Failed to update owner')
  } finally {
    clear()
  }
}

export async function deleteOwner(ownerId: string) {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { error } = await supabase
      .from('owners').update({ is_active: false }).eq('owner_id', ownerId).abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to deactivate owner')
  } catch (e) {
    throw toApiError(e, 'Failed to deactivate owner')
  } finally {
    clear()
  }
}

export async function createCategory(payload: Omit<Category, 'category_id' | 'is_active'>) {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from('categories').insert(payload).select().single().abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to create category')
    return data as Category
  } catch (e) {
    throw toApiError(e, 'Failed to create category')
  } finally {
    clear()
  }
}

export async function updateCategory(categoryId: string, payload: Partial<Omit<Category, 'category_id'>>) {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from('categories').update(payload).eq('category_id', categoryId).select().single().abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to update category')
    return data as Category
  } catch (e) {
    throw toApiError(e, 'Failed to update category')
  } finally {
    clear()
  }
}

export async function deleteCategory(categoryId: string) {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { error } = await supabase
      .from('categories').update({ is_active: false }).eq('category_id', categoryId).abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to deactivate category')
  } catch (e) {
    throw toApiError(e, 'Failed to deactivate category')
  } finally {
    clear()
  }
}

export async function createDepartment(payload: Omit<Department, 'department_id' | 'is_active'>) {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from('departments').insert(payload).select().single().abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to create department')
    return data as Department
  } catch (e) {
    throw toApiError(e, 'Failed to create department')
  } finally {
    clear()
  }
}

export async function updateDepartment(departmentId: string, payload: Partial<Omit<Department, 'department_id'>>) {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { data, error } = await supabase
      .from('departments').update(payload).eq('department_id', departmentId).select().single().abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to update department')
    return data as Department
  } catch (e) {
    throw toApiError(e, 'Failed to update department')
  } finally {
    clear()
  }
}

export async function deleteDepartment(departmentId: string) {
  const { signal, clear } = createTimeoutSignal()
  try {
    const { error } = await supabase
      .from('departments').update({ is_active: false }).eq('department_id', departmentId).abortSignal(signal)
    if (error) throw new Error(error.message || 'Failed to deactivate department')
  } catch (e) {
    throw toApiError(e, 'Failed to deactivate department')
  } finally {
    clear()
  }
}
