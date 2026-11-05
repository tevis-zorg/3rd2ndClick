import { DEMO_VIDEO_ID } from './demo.ts'

export interface Project {
  slug: string
  title: string
  category: string
  description: string
  client: string
  editor: string
  year: string
  videoId: string
  image: string
  imageAlt: string
  featured: boolean
  videoUnavailable?: boolean
  demoPreview?: boolean
}

// Presentation-only samples used when the CMS has no public projects yet.
// They are never written to or sent to the API/database.
export const DEMO_PROJECTS: Project[] = [
  { slug: 'demo-cut-01', title: 'Demonstration cut 01', category: 'Sample film', description: 'A temporary video preview for this demonstration.', client: 'Collective Edit', editor: 'Studio sample', year: 'Demo', videoId: DEMO_VIDEO_ID, image: '', imageAlt: 'Demonstration film still', featured: true, demoPreview: true },
  { slug: 'demo-cut-02', title: 'Demonstration cut 02', category: 'Sample film', description: 'A temporary video preview for this demonstration.', client: 'Collective Edit', editor: 'Studio sample', year: 'Demo', videoId: DEMO_VIDEO_ID, image: '', imageAlt: 'Demonstration film still', featured: true, demoPreview: true },
  { slug: 'demo-cut-03', title: 'Demonstration cut 03', category: 'Sample film', description: 'A temporary video preview for this demonstration.', client: 'Collective Edit', editor: 'Studio sample', year: 'Demo', videoId: DEMO_VIDEO_ID, image: '', imageAlt: 'Demonstration film still', featured: true, demoPreview: true },
  { slug: 'demo-cut-04', title: 'Demonstration cut 04', category: 'Sample film', description: 'A temporary video preview for this demonstration.', client: 'Collective Edit', editor: 'Studio sample', year: 'Demo', videoId: DEMO_VIDEO_ID, image: '', imageAlt: 'Demonstration film still', featured: true, demoPreview: true },
  { slug: 'demo-cut-05', title: 'Demonstration cut 05', category: 'Sample film', description: 'A temporary video preview for this demonstration.', client: 'Collective Edit', editor: 'Studio sample', year: 'Demo', videoId: DEMO_VIDEO_ID, image: '', imageAlt: 'Demonstration film still', featured: true, demoPreview: true },
]

export async function getProjects(): Promise<Project[]> {
  const response = await fetch('/api/projects')
  if (!response.ok) throw new Error('Project list is temporarily unavailable.')
  return response.json() as Promise<Project[]>
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const response = await fetch('/api/projects/featured')
  if (!response.ok) throw new Error('Featured work is temporarily unavailable.')
  return response.json() as Promise<Project[]>
}

export async function getProject(slug: string): Promise<Project | null> {
  const response = await fetch(`/api/projects/${encodeURIComponent(slug)}`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Project details are temporarily unavailable.')
  return response.json() as Promise<Project>
}
