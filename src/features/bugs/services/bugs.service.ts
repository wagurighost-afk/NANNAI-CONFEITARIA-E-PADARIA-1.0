import { apiClient } from '@/core/api/apiClient'
import type {
  BugListQuery,
  BugListResult,
  BugModuleOption,
  BugReport,
  BugStatus,
  CreateBugFormInput,
} from '@/features/bugs/types/bug.types'
import { detectClientEnvironment } from '@/features/bugs/utils/detectClientEnvironment'

export async function fetchBugModules(): Promise<BugModuleOption[]> {
  const { data } = await apiClient.get<BugModuleOption[]>('/bugs/modules')
  return data
}

export async function fetchBugs(query: BugListQuery = {}): Promise<BugListResult> {
  const { data } = await apiClient.get<BugListResult>('/bugs', { params: query })
  return data
}

export async function fetchBugById(id: string): Promise<BugReport> {
  const { data } = await apiClient.get<BugReport>(`/bugs/${id}`)
  return data
}

export interface CreateBugPayload extends CreateBugFormInput {
  reportedById: string
  reportedByName: string
  reportedByEmail: string
}

export async function createBugReport(input: CreateBugPayload): Promise<BugReport> {
  const environment = detectClientEnvironment()
  const formData = new FormData()

  formData.append('title', input.title)
  formData.append('description', input.description)
  formData.append('moduleId', input.moduleId)
  formData.append('priority', input.priority)
  formData.append('os', environment.os)
  formData.append('browser', environment.browser)
  formData.append('appVersion', environment.appVersion)
  formData.append('reportedById', input.reportedById)
  formData.append('reportedByName', input.reportedByName)
  formData.append('reportedByEmail', input.reportedByEmail)

  for (const image of input.images ?? []) {
    formData.append('images', image)
  }

  if (input.video) {
    formData.append('video', input.video)
  }

  const { data } = await apiClient.post<BugReport>('/bugs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return data
}

export async function updateBugStatus(
  id: string,
  payload: { status: BugStatus; note?: string },
): Promise<BugReport> {
  const { data } = await apiClient.patch<BugReport>(`/bugs/${id}/status`, payload)
  return data
}
