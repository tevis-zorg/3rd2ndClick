import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { Link, Navigate, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { Button, TextLink } from '../components/Button.tsx'
import Eyebrow from '../components/Eyebrow.tsx'
import { useAdminData, type AdminProject } from './AdminData.tsx'
import { parseYouTubeVideoId } from './youtube.ts'

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
const projectFilters = ['all', 'published', 'drafts'] as const

export function AdminLoginPage() {
  const { login, authenticated, loading } = useAdminData()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  if (authenticated) return <Navigate replace to="/admin" />
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('')
    try { await login(password); navigate('/admin') }
    catch (issue) { setMessage(issue instanceof Error ? issue.message : 'Sign in failed.') }
    finally { setBusy(false) }
  }
  return (
    <main className="admin-login">
      <div className="admin-login__panel">
        <Link aria-label="Collective Edit home" className="studio-mark" to="/">
          <span aria-hidden="true" className="studio-mark__symbol">C</span>
          <span>COLLECTIVE<br />EDIT</span>
        </Link>
        <Eyebrow>Single administrator</Eyebrow>
        <h1 className="section-title">Studio<br />access.</h1>
        <p className="admin-login__note">Sign in to manage the collective’s project library.</p>
        <form onSubmit={submit}>
          <label className="admin-field"><span>Administrator password</span><input autoComplete="current-password" name="password" onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" required type="password" value={password} /></label>
          <Button className="admin-login__submit" disabled={busy || loading} type="submit">{busy ? 'Signing in…' : 'Sign in'}</Button>
        </form>
        {message && <p className="admin-inline-note" role="alert">{message}</p>}
        <Link className="admin-back-link" to="/">← Return to Collective Edit</Link>
      </div>
    </main>
  )
}

export function AdminLayout() {
  const { authenticated, loading, logout, error } = useAdminData()
  if (loading) return <main className="admin-content"><p>Checking studio session…</p></main>
  if (!authenticated) return <Navigate replace to="/admin/login" />
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link aria-label="Collective Edit dashboard" className="studio-mark" to="/admin">
          <span aria-hidden="true" className="studio-mark__symbol">C</span>
          <span>COLLECTIVE<br />EDIT</span>
        </Link>
        <nav aria-label="Admin navigation" className="admin-navigation">
          <NavLink end to="/admin">Overview</NavLink>
          <NavLink to="/admin/projects">Projects</NavLink>
        </nav>
        <div className="admin-topbar__right"><span className="admin-prototype-badge">Connected studio</span><button onClick={() => { void logout() }} type="button">Sign out</button><Link to="/">Public site ↗</Link></div>
      </header>
      <div className="admin-main">
        <main className="admin-content"><Outlet /></main>
        {error && <p className="admin-inline-note" role="alert">{error}</p>}
        <footer className="admin-disclaimer">Project changes are saved to the studio database.</footer>
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  const { projects } = useAdminData()
  const counts = [
    ['Total projects', projects.length, 'total'],
    ['Published', projects.filter((project) => project.isPublished).length, 'published'],
    ['Drafts', projects.filter((project) => !project.isPublished).length, 'drafts'],
    ['Featured', projects.filter((project) => project.isFeatured).length, 'featured'],
  ]
  const recent = [...projects].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 3)

  return <>
    <div className="admin-page-heading"><div><Eyebrow>Studio / Overview</Eyebrow><h1>Good morning.</h1><p>A clear view of the work in your collective’s reel.</p></div><Button as="link" to="/admin/projects/new">Add a project <span aria-hidden="true">＋</span></Button></div>
    <section aria-label="Project counts" className="admin-stats">{counts.map(([label, count, key]) => <Link className="admin-stat" key={key} to="/admin/projects"><span>{label}</span><strong>{count}</strong><small>in the project library</small></Link>)}</section>
    <section className="admin-recent"><div className="admin-section-heading"><div><Eyebrow>Recently in the library</Eyebrow><h2>Project list</h2></div><TextLink to="/admin/projects">View all <span aria-hidden="true">→</span></TextLink></div>
      {recent.length ? <div className="admin-project-rows">{recent.map((project) => <ProjectRow key={project.id} project={project} compact />)}</div> : <AdminEmptyState title="Your project library is ready." copy="Add a project to start building the collective’s reel." action={<Button as="link" to="/admin/projects/new">Add the first project</Button>} />}
    </section>
  </>
}

interface ProjectRowProps {
  project: AdminProject
  compact?: boolean
  onTogglePublished?: () => void
  onToggleFeatured?: () => void
  onDelete?: () => void
  onMove?: (direction: -1 | 1) => void
}

function ProjectRow({ project, compact = false, onTogglePublished, onToggleFeatured, onDelete, onMove }: ProjectRowProps) {
  return (
    <article className={`admin-project-row ${compact ? 'admin-project-row--compact' : ''}`}>
      <div className="admin-project-row__identity"><span className="admin-project-row__order">{String(project.sortOrder).padStart(2, '0')}</span><div><Link className="admin-project-row__title" to={`/admin/projects/${project.id}/edit`}>{project.title || 'Untitled project'}</Link><span>{project.category || 'Uncategorised'} · {project.year || 'Year not set'}</span></div></div>
      <span className={`admin-status ${project.isPublished ? 'is-published' : ''}`}>{project.isPublished ? 'Published' : 'Draft'}</span>
      {!compact && <div className="admin-project-row__controls"><button onClick={onToggleFeatured} type="button">{project.isFeatured ? '★ Featured' : '☆ Feature'}</button><button onClick={onTogglePublished} type="button">{project.isPublished ? 'Unpublish' : 'Publish'}</button><div className="admin-reorder"><button aria-label={`Move ${project.title} up`} onClick={() => onMove?.(-1)} type="button">↑</button><button aria-label={`Move ${project.title} down`} onClick={() => onMove?.(1)} type="button">↓</button></div><Link aria-label={`Edit ${project.title}`} className="admin-edit-link" to={`/admin/projects/${project.id}/edit`}>Edit ↗</Link><button className="admin-delete" onClick={onDelete} type="button">Delete</button></div>}
    </article>
  )
}

interface AdminEmptyStateProps {
  title: string
  copy: string
  action?: ReactNode
}

function AdminEmptyState({ title, copy, action }: AdminEmptyStateProps) {
  return <div className="admin-empty"><span aria-hidden="true">✳</span><h2>{title}</h2><p>{copy}</p>{action}</div>
}

export function AdminProjectsPage() {
  const { projects, updateProject, deleteProject } = useAdminData()
  const [filter, setFilter] = useState<'all' | 'published' | 'drafts'>('all')
  const ordered = useMemo(() => [...projects].sort((a, b) => a.sortOrder - b.sortOrder), [projects])
  const filtered = ordered.filter((project) => filter === 'all' || (filter === 'published' ? project.isPublished : !project.isPublished))

  function move(project: AdminProject, direction: -1 | 1) {
    const index = ordered.findIndex((item) => item.id === project.id)
    const neighbor = ordered[index + direction]
    if (!neighbor) return
    updateProject(project.id, { sortOrder: neighbor.sortOrder })
    updateProject(neighbor.id, { sortOrder: project.sortOrder })
  }

  return <>
    <div className="admin-page-heading"><div><Eyebrow>Studio / Work library</Eyebrow><h1>Projects</h1><p>Manage the films, stories, and campaigns in your reel.</p></div><Button as="link" to="/admin/projects/new">Add a project <span aria-hidden="true">＋</span></Button></div>
    <div className="admin-list-toolbar"><div aria-label="Filter projects" className="admin-filter-tabs">{projectFilters.map((item) => <button aria-pressed={filter === item} key={item} onClick={() => setFilter(item)} type="button">{titleCase(item)}</button>)}</div><span>{filtered.length} {filtered.length === 1 ? 'project' : 'projects'}</span></div>
    {filtered.length ? <div className="admin-project-rows">{filtered.map((project) => <ProjectRow key={project.id} project={project} onToggleFeatured={() => updateProject(project.id, { isFeatured: !project.isFeatured })} onTogglePublished={() => updateProject(project.id, { isPublished: !project.isPublished })} onDelete={() => { if (window.confirm(`Delete “${project.title}” from the project library?`)) deleteProject(project.id) }} onMove={(direction) => move(project, direction)} />)}</div> : <AdminEmptyState title={projects.length ? `No ${filter} projects.` : 'Your project library is empty.'} copy={projects.length ? 'Try another filter to see more of the reel.' : 'Add your first project to begin shaping the work library.'} action={!projects.length && <Button as="link" to="/admin/projects/new">Add the first project</Button>} />}
  </>
}

interface ProjectFormValues {
  title: string
  slug: string
  category: string
  description: string
  youtubeUrl: string
  videoId?: string
  client: string
  editor: string
  year: string
  isFeatured: boolean
  isPublished: boolean
  sortOrder: number | string
}

const emptyForm: ProjectFormValues = {
  title: '', slug: '', category: '', description: '', youtubeUrl: '', client: '', editor: '', year: String(new Date().getFullYear()), isFeatured: false, isPublished: false, sortOrder: 10,
}

export function AdminProjectFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, createProject, updateProject, deleteProject } = useAdminData()
  const existing = id ? projects.find((project) => project.id === id) : null
  const [form, setForm] = useState<ProjectFormValues>(() => existing ? { ...existing } : { ...emptyForm, sortOrder: (projects.length + 1) * 10 })
  const [videoError, setVideoError] = useState('')
  const [formError, setFormError] = useState('')
  const parsedVideo = parseYouTubeVideoId(form.youtubeUrl || '')

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setForm((current: ProjectFormValues) => ({ ...current, [name]: value } as ProjectFormValues))
    if (name === 'youtubeUrl') setVideoError(parseYouTubeVideoId(value).error)
  }

  function updateToggle(event: ChangeEvent<HTMLInputElement>) {
    const { name, checked } = event.target
    setForm((current: ProjectFormValues) => ({ ...current, [name]: checked } as ProjectFormValues))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const video = parseYouTubeVideoId(form.youtubeUrl || '')
    setVideoError(video.error)
    if (video.error) return
    if (!form.title.trim() || !form.slug.trim()) {
      setFormError('Add a project title and slug before saving.')
      return
    }

    const record = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      category: form.category.trim(), description: form.description.trim(), youtubeUrl: form.youtubeUrl.trim(),
      client: form.client.trim(), editor: form.editor.trim(), year: form.year.trim(),
      isFeatured: form.isFeatured, isPublished: form.isPublished,
      sortOrder: Number(form.sortOrder) || 0,
    }
    try {
      if (existing) await updateProject(existing.id, record)
      else await createProject({ ...record, videoId: video.id })
      navigate('/admin/projects')
    } catch (issue) {
      setFormError(issue instanceof Error ? issue.message : 'Project could not be saved.')
    }
  }

  if (id && !existing) return <AdminEmptyState title="Project not found." copy="It may have been removed from the project library." action={<Button as="link" to="/admin/projects">Back to projects</Button>} />

  const videoId = parsedVideo.id || form.videoId || ''
  return <>
    <div className="admin-page-heading admin-page-heading--form"><div><Eyebrow>Studio / {existing ? 'Edit project' : 'New project'}</Eyebrow><h1>{existing ? 'Refine the details.' : 'Add to the reel.'}</h1><p>Project details are saved to the studio library.</p></div></div>
    <form className="admin-project-form" onSubmit={save}>
      <div className="admin-form-main">
        <label className="admin-field"><span>Project title <b>*</b></span><input autoComplete="off" name="title" onChange={(event: ChangeEvent<HTMLInputElement>) => { updateField(event); if (!existing) setForm((current: ProjectFormValues) => ({ ...current, slug: event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })) }} placeholder="A title that carries the story" required value={form.title} /></label>
        <label className="admin-field"><span>Slug <b>*</b></span><input autoComplete="off" name="slug" onChange={updateField} placeholder="project-title" required value={form.slug} /><small>Used in the project URL.</small></label>
        <div className="admin-form-grid"><label className="admin-field"><span>Category</span><input name="category" onChange={updateField} placeholder="Brand film, documentary…" value={form.category} /></label><label className="admin-field"><span>Year</span><input inputMode="numeric" name="year" onChange={updateField} placeholder="2025" value={form.year} /></label></div>
        <label className="admin-field"><span>Description</span><textarea name="description" onChange={updateField} placeholder="What is the project, and what was your role in shaping it?" rows={6} value={form.description} /></label>
        <div className="admin-form-grid"><label className="admin-field"><span>Client</span><input name="client" onChange={updateField} placeholder="Client or production partner" value={form.client} /></label><label className="admin-field"><span>Editor</span><input name="editor" onChange={updateField} placeholder="Editor name" value={form.editor} /></label></div>
        <label className="admin-field"><span>YouTube URL</span><input aria-describedby="youtube-help" aria-invalid={Boolean(videoError)} autoComplete="url" name="youtubeUrl" onChange={updateField} placeholder="https://youtu.be/…" type="url" value={form.youtubeUrl || ''} /><small id="youtube-help">Use a watch, youtu.be, or Shorts link. The video ID is used for the preview.</small>{videoError && <span className="admin-field-error" role="alert">{videoError}</span>}</label>
        {videoId ? <div className="admin-video-preview"><span>Video preview</span><div><iframe allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`} title={`${form.title || 'Project'} video preview`} /></div><small>If playback is unavailable, <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`} rel="noreferrer" target="_blank">open the video on YouTube ↗</a></small></div> : <div className="admin-video-empty">Add a valid YouTube URL to preview the film.</div>}
        {formError && <p className="admin-field-error" role="alert">{formError}</p>}
      </div>
      <aside className="admin-form-side"><div className="admin-form-side__block"><Eyebrow>Publishing</Eyebrow><label className="admin-check"><input checked={form.isPublished} name="isPublished" onChange={updateToggle} type="checkbox" /><span><strong>Published</strong><small>Visible in the public work library</small></span></label><label className="admin-check"><input checked={form.isFeatured} name="isFeatured" onChange={updateToggle} type="checkbox" /><span><strong>Featured project</strong><small>Eligible for the home page selection</small></span></label></div><label className="admin-field admin-sort-field"><span>Display order</span><input min="0" name="sortOrder" onChange={updateField} type="number" value={form.sortOrder} /><small>Lower numbers appear first.</small></label><div className="admin-form-actions"><Button type="submit">{existing ? 'Save project' : 'Create project'} <span aria-hidden="true">→</span></Button><Button as="link" to="/admin/projects" variant="outline">Cancel</Button>{existing && <button className="admin-delete admin-form-delete" onClick={() => { if (window.confirm(`Delete “${existing.title}” from the project library?`)) { deleteProject(existing.id); navigate('/admin/projects') } }} type="button">Delete project</button>}</div></aside>
    </form>
  </>
}
