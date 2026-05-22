import { supabase } from '@/lib/supabase'
import type { Owner, Category, Department } from '@/types'

export async function fetchActiveOwners(): Promise<Owner[]> {
  const { data, error } = await supabase
    .from('active_owners')
    .select('*')
    .order('owner_name')
  if (error) throw error
  return (data ?? []) as Owner[]
}

export async function fetchActiveCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('active_categories')
    .select('*')
    .order('category_name')
  if (error) throw error
  return (data ?? []) as Category[]
}

export async function fetchActiveDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('active_departments')
    .select('*')
    .order('department_name')
  if (error) throw error
  return (data ?? []) as Department[]
}

// ─── Full CRUD for management pages ──────────────────────────────────────────

export async function createOwner(payload: Omit<Owner, 'owner_id' | 'is_active'>) {
  const { data, error } = await supabase.from('owners').insert(payload).select().single()
  if (error) throw error
  return data as Owner
}

export async function updateOwner(ownerId: string, payload: Partial<Omit<Owner, 'owner_id'>>) {
  const { data, error } = await supabase
    .from('owners').update(payload).eq('owner_id', ownerId).select().single()
  if (error) throw error
  return data as Owner
}

export async function deleteOwner(ownerId: string) {
  const { error } = await supabase
    .from('owners').update({ is_active: false }).eq('owner_id', ownerId)
  if (error) throw error
}

export async function createCategory(payload: Omit<Category, 'category_id' | 'is_active'>) {
  const { data, error } = await supabase.from('categories').insert(payload).select().single()
  if (error) throw error
  return data as Category
}

export async function updateCategory(categoryId: string, payload: Partial<Omit<Category, 'category_id'>>) {
  const { data, error } = await supabase
    .from('categories').update(payload).eq('category_id', categoryId).select().single()
  if (error) throw error
  return data as Category
}

export async function deleteCategory(categoryId: string) {
  const { error } = await supabase
    .from('categories').update({ is_active: false }).eq('category_id', categoryId)
  if (error) throw error
}

export async function createDepartment(payload: Omit<Department, 'department_id' | 'is_active'>) {
  const { data, error } = await supabase.from('departments').insert(payload).select().single()
  if (error) throw error
  return data as Department
}

export async function updateDepartment(departmentId: string, payload: Partial<Omit<Department, 'department_id'>>) {
  const { data, error } = await supabase
    .from('departments').update(payload).eq('department_id', departmentId).select().single()
  if (error) throw error
  return data as Department
}

export async function deleteDepartment(departmentId: string) {
  const { error } = await supabase
    .from('departments').update({ is_active: false }).eq('department_id', departmentId)
  if (error) throw error
}
