import { Link } from 'react-router-dom'
import { DEMO_VIDEO_CREDIT, DEMO_VIDEO_ID } from '../data/demo.ts'

interface ProjectFrameProps {
  to?: string
  href?: string
  title: string
  category: string
  credit?: string
  image?: string
  imageAlt?: string
  videoId?: string
  videoPreview?: boolean
  demoLabel?: boolean
}

export default function ProjectFrame({ to, href, title, category, credit, image, imageAlt = '', videoId, videoPreview = false, demoLabel = false }: ProjectFrameProps) {
  const isDemo = videoPreview && (!videoId || demoLabel)
  const previewId = videoId || DEMO_VIDEO_ID
  const media = (
    <>
      <div className={`project-frame__media ${videoPreview ? 'project-frame__media--video' : ''}`}>
        {videoPreview ? <iframe
          aria-hidden="true"
          className="project-frame__video"
          loading="lazy"
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(previewId)}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${encodeURIComponent(previewId)}&modestbranding=1&rel=0`}
          tabIndex={-1}
          title={isDemo ? 'Demonstration sample video' : `${title} video preview`}
        /> : image ? <img alt={imageAlt} loading="lazy" src={image} /> : null}
      </div>
      <div className="project-frame__meta">
        <span className="project-frame__title">{title}</span>
        <span className="project-frame__category">{isDemo ? `Demo only · ${DEMO_VIDEO_CREDIT}` : credit || category}</span>
      </div>
    </>
  )

  return (
    to ? <Link className={`project-frame ${videoPreview ? 'project-frame--video' : ''}`} to={to}>{media}</Link>
      : href ? <a className={`project-frame ${videoPreview ? 'project-frame--video' : ''}`} href={href} rel="noreferrer" target="_blank">{media}</a>
        : <article className={`project-frame ${videoPreview ? 'project-frame--video' : ''}`}>{media}</article>
  )
}
