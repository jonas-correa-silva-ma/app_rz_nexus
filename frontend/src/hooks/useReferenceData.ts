import { useMemo } from 'react'
import { services } from '@/services'
import type { ID, Person, Project } from '@/types'
import { useQuery } from './useQuery'

/** Pessoas e projetos usados em seletores e para exibir nomes a partir de ids. */
export function useReferenceData() {
  const people = useQuery(() => services.people.list())
  const projects = useQuery(() => services.projects.list())

  return useMemo(() => {
    const peopleList = people.data ?? []
    const projectList = [...(projects.data ?? [])].sort((a, b) => a.name.localeCompare(b.name))
    const peopleById = new Map<ID, Person>(peopleList.map((p) => [p.id, p]))
    const projectsById = new Map<ID, Project>(projectList.map((p) => [p.id, p]))
    return {
      people: peopleList,
      projects: projectList,
      personName: (id?: ID) => (id && peopleById.get(id)?.name) || '—',
      projectName: (id?: ID) => (id && projectsById.get(id)?.name) || '—',
      projectsById,
      loading: people.loading || projects.loading,
    }
  }, [people.data, projects.data, people.loading, projects.loading])
}
