import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Eyebrow from '../components/Eyebrow.tsx'
import ProjectFrame from '../components/ProjectFrame.tsx'
import VideoFrame from '../components/VideoFrame.tsx'
import { Button, TextLink } from '../components/Button.tsx'
import { DEMO_PROJECTS, getFeaturedProjects, getProject, getProjects } from '../data/projects.ts'
import type { Project } from '../data/projects.ts'
import { DEMO_VIDEO_CREDIT, DEMO_VIDEO_ID, DEMO_VIDEO_SOURCE } from '../data/demo.ts'

const services = [
  { number: '01', title: 'Editorial', copy: 'Story-first editing for documentaries, series, and films. We find the shape in the footage and make every cut earn its place.' },
  { number: '02', title: 'Brand films', copy: 'Distinctive films for people with something to say. From the first treatment through final delivery, we build a clear point of view.' },
  { number: '03', title: 'Campaigns & social', copy: 'One strong idea, thoughtfully adapted. Cutdowns, vertical versions, and platform-ready deliverables with the same care as the master.' },
  { number: '04', title: 'Finishing', copy: 'A considered final pass: colour, sound, titles, versioning, and delivery prepared for the places your film needs to live.' },
]

const approach = [
  ['Listen closely', 'We start with the brief, the audience, and what you want people to feel. The right edit begins before the timeline.'],
  ['Find the story', 'We review the material together, identify what matters, and agree on a clear editorial direction before the first cut.'],
  ['Make it precise', 'We share considered cuts, invite useful feedback, and refine the work until every detail feels intentional.'],
]

const filters = ['All', 'Commercial', 'Special projects'] as const
type WorkFilter = typeof filters[number]

interface PageIntroProps {
  eyebrow: string
  title: ReactNode
  copy?: string
}

function PageIntro({ eyebrow, title, copy }: PageIntroProps) {
  return (
    <section className="page-intro studio-container">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="display-title">{title}</h1>
      {copy && <p className="body-copy page-intro__copy">{copy}</p>}
    </section>
  )
}

function ProjectList({ items, videoPreview = false, flush = false }: { items: Project[]; videoPreview?: boolean; flush?: boolean }) {
  return (
    <div className={`project-list ${flush ? 'project-list--flush' : ''}`}>
      {items.map((project) => (
        <ProjectFrame
          key={project.slug}
          to={`/works/${project.slug}`}
          demoLabel={project.demoPreview}
          title={project.title}
          category={project.category}
          credit={project.editor}
          image={project.image}
          imageAlt={project.imageAlt}
          videoId={project.videoId}
          videoPreview={videoPreview}
        />
      ))}
    </div>
  )
}

export function HomePage() {
  const [featured, setFeatured] = useState<Project[]>([])
  const [workError, setWorkError] = useState('')
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  useEffect(() => { getFeaturedProjects().then((items) => setFeatured(items.length ? items : DEMO_PROJECTS)).catch((error: Error) => setWorkError(error.message)).finally(() => setLoadingFeatured(false)) }, [])
  const latest = featured[0]
  const demoPreview = Boolean(latest?.demoPreview) || (!loadingFeatured && !workError && !latest?.videoId)
  const heroVideoId = latest?.videoId || (demoPreview ? DEMO_VIDEO_ID : '')
  const heroStyle = latest?.image
    ? { backgroundImage: `linear-gradient(0deg, rgb(0 0 0 / 62%), transparent 42%), url("${latest.image}")` }
    : undefined

  return (
    <main>
      <section aria-label="Latest work" className="home-hero" style={heroStyle}>
        {heroVideoId && <iframe aria-hidden="true" className="home-hero__video" allow="autoplay; encrypted-media; picture-in-picture" loading="eager" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(heroVideoId)}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${encodeURIComponent(heroVideoId)}&modestbranding=1&rel=0`} tabIndex={-1} title={demoPreview ? 'Demonstration sample video' : 'Latest film preview'} />}
        <div className="home-hero__veil" />
        <div className="home-hero__caption">
          <Eyebrow>{demoPreview ? 'Demonstration / Sample footage' : latest ? `Latest / ${latest.year}` : loadingFeatured ? 'Loading featured work' : 'Independent films'}</Eyebrow>
          <Link to={latest ? `/works/${latest.slug}` : '/works'}>
            <h1>{latest?.title || (loadingFeatured ? 'Opening the reel.' : 'Collective Edit')}</h1>
            {demoPreview ? <span>Demo only · {DEMO_VIDEO_CREDIT}</span> : latest ? <span>{latest.client} <b>·</b> {latest.category} <b>↗</b></span> : <span>{loadingFeatured ? 'Finding the latest work' : 'A video-editing collective'}</span>}
          </Link>
        </div>
        <a className="home-hero__scroll" href="#studio-intro">Scroll to explore <span aria-hidden="true">↓</span></a>
        <span className="home-hero__index">{demoPreview ? <a href={DEMO_VIDEO_SOURCE} rel="noreferrer" target="_blank">{DEMO_VIDEO_CREDIT}</a> : 'Independent post-production collective'}</span>
      </section>

      <section className="intro-band studio-container" id="studio-intro">
        <Eyebrow>A studio for the in-between</Eyebrow>
        <p>We bring shape to good ideas and <em>meaning</em> to moving images. From first assembly to final frame, we work alongside teams who care about the story.</p>
        <TextLink to="/about">Meet the collective <span aria-hidden="true">↗</span></TextLink>
      </section>

      <section className="section-block studio-container">
        <div className="section-heading">
          <div><Eyebrow>Selected work</Eyebrow><h2 className="section-title">Films made<br />in good company.</h2></div>
          <TextLink to="/works">All projects <span aria-hidden="true">↗</span></TextLink>
        </div>
        {loadingFeatured ? <p className="works-empty" role="status">Loading selected work…</p> : workError ? <p className="works-empty" role="status">{workError}</p> : featured.length ? <ProjectList items={featured} /> : <p className="works-empty">Featured films will appear here soon.</p>}
      </section>

      <section className="services-band">
        <div className="studio-container services-band__inner">
          <div><Eyebrow>What we do</Eyebrow><h2 className="section-title">The story<br />comes first.</h2><TextLink to="/services">See all services <span aria-hidden="true">↗</span></TextLink></div>
          <div className="service-index">
            {services.map(({ number, title }) => <Link key={number} to="/services"><span>{number}</span><span>{title}</span><span aria-hidden="true">↗</span></Link>)}
          </div>
        </div>
      </section>

      <section className="section-block studio-container approach-block">
        <div className="approach-block__heading"><Eyebrow>Our approach</Eyebrow><h2 className="section-title">Good work is<br />a conversation.</h2><p className="body-copy">Thoughtful editing comes from listening well, finding the thread, and keeping everyone close to the work.</p></div>
        <div className="approach-steps">{approach.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="contact-banner">
        <div className="studio-container contact-banner__inner"><Eyebrow>For new projects & collaborations</Eyebrow><h2 className="section-title">Let’s make<br />something lasting.</h2><Button as="link" to="/contact">Get in touch <span aria-hidden="true">↗</span></Button></div>
      </section>
    </main>
  )
}

export function ServicesPage() {
  return (
    <main>
      <PageIntro eyebrow="Services / Capabilities" title={<>Stories first.<br /><em>Every frame matters.</em></>} copy="We work with production companies, agencies, and independent storytellers to carry a strong idea from first cut to final delivery." />
      <section className="section-block studio-container service-detail-list">
        {services.map(({ number, title, copy }) => <article key={number}><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div><span aria-hidden="true">↗</span></article>)}
      </section>
      <section className="services-note studio-container"><Eyebrow>One team, end to end</Eyebrow><p>One edit or a complete campaign rollout, we shape the collaboration around the project and keep the process considered and clear.</p><TextLink to="/contact">Talk through a project <span aria-hidden="true">↗</span></TextLink></section>
    </main>
  )
}

function projectMatchesFilter(project: Project, filter: WorkFilter) {
  if (filter === 'All') return true
  const isCommercial = /brand|campaign/i.test(project.category)
  return filter === 'Commercial' ? isCommercial : !isCommercial
}

export function WorksPage() {
  const [filter, setFilter] = useState<WorkFilter>('All')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { getProjects().then((items) => setProjects(items.length ? items : DEMO_PROJECTS)).catch((issue: Error) => setError(issue.message)).finally(() => setLoading(false)) }, [])
  const visibleProjects = projects.filter((project) => projectMatchesFilter(project, filter))

  return (
    <main className="works-page">
      <PageIntro eyebrow="Collective Edit / Selected work" title={<>Work in<br /><em>motion.</em></>} copy="Films made in close collaboration with people who care about the details." />
      <div aria-label="Filter projects" className="work-filters">{filters.map((item) => <button aria-pressed={filter === item} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}</div>
      {loading ? <div className="studio-container works-empty">Loading selected work…</div> : error ? <div className="studio-container works-empty" role="status">{error}</div> : visibleProjects.length ? <section className="studio-container works-grid"><ProjectList flush items={visibleProjects} videoPreview /></section> : <div className="studio-container works-empty">No projects in this collection yet.</div>}
      <section className="studio-container works-cta"><p>Have a project finding its shape?</p><TextLink to="/contact">Start a conversation <span aria-hidden="true">↗</span></TextLink></section>
    </main>
  )
}

export function ProjectDetailPage() {
  const { slug } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true)
    setProject(null)
    setError('')
    if (slug) getProject(slug).then((item) => { if (active) setProject(item || DEMO_PROJECTS.find((demo) => demo.slug === slug) || null) }).catch((issue: Error) => { if (active) setError(issue.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])
  if (loading) return <main className="studio-container missing-project"><Eyebrow>Project / Loading</Eyebrow><p className="body-copy">Opening the film…</p></main>
  if (error) return <main className="studio-container missing-project"><Eyebrow>Project / Unavailable</Eyebrow><p className="body-copy" role="status">{error}</p><TextLink to="/works">Back to selected work <span aria-hidden="true">↗</span></TextLink></main>
  if (!project) return <main className="studio-container missing-project"><Eyebrow>Project / Not found</Eyebrow><h1 className="section-title">This film isn’t in the reel.</h1><p className="body-copy">The project may have moved, or the link may be out of date.</p><TextLink to="/works">Back to selected work <span aria-hidden="true">↗</span></TextLink></main>

  return (
    <main className="project-detail studio-container">
      <div className="project-detail__intro"><Eyebrow>{project.category} / {project.year}</Eyebrow><h1 className="display-title">{project.title}</h1><p className="body-copy">{project.description}</p></div>
      <VideoFrame videoId={project.demoPreview ? '' : project.videoId} title={`${project.title} — project film`} unavailable={project.videoUnavailable} />
      <dl className="project-facts">{[['Client', project.client], ['Editor', project.editor], ['Year', project.year], ['Category', project.category]].map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
      <div className="project-detail__next"><TextLink to="/works">← All projects</TextLink><TextLink to="/contact">Work with us <span aria-hidden="true">↗</span></TextLink></div>
    </main>
  )
}

export function AboutPage() {
  return (
    <main className="info-page studio-container">
      <article className="info-page__copy">
        <p>Collective Edit is an independent video-editing studio bringing together a small team of editors and trusted creative partners.</p>
        <p>We work across commercial films, documentary, and culture-led projects. Our focus is always the same: find the story inside the material and give it room to land.</p>
        <p>Good collaborations are built on clear communication and mutual trust. We work closely with production teams from first conversation through final delivery, adapting our process to what the film needs.</p>
        <div className="info-page__links"><Link to="/services">Services ↗</Link><Link to="/works">Selected work ↗</Link><Link to="/contact">Contact ↗</Link></div>
      </article>
    </main>
  )
}

export function ContactPage() {
  return (
    <main className="info-page studio-container">
      <article className="info-page__copy">
        <p>For new projects, collaborations, and good questions, get in touch directly.</p>
        <p><a className="info-page__email" href="mailto:hello@collectiveedit.studio">HELLO@COLLECTIVEEDIT.STUDIO</a></p>
        <p className="info-page__secondary">Remote-first · Available worldwide</p>
        <div className="info-page__links"><a href="https://www.instagram.com/" rel="noreferrer" target="_blank">Instagram ↗</a><a href="https://www.linkedin.com/" rel="noreferrer" target="_blank">LinkedIn ↗</a></div>
      </article>
    </main>
  )
}
