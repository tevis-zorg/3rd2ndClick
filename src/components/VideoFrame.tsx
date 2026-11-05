import { DEMO_VIDEO_CREDIT, DEMO_VIDEO_ID, DEMO_VIDEO_SOURCE } from '../data/demo.ts'

interface VideoFrameProps {
  videoId: string
  title?: string
  unavailable?: boolean
}

export default function VideoFrame({ videoId, title = 'Project film', unavailable = false }: VideoFrameProps) {
  const demoPreview = !videoId && !unavailable
  const playableVideoId = demoPreview ? DEMO_VIDEO_ID : videoId

  if (unavailable) {
    return <div className="video-frame"><div className="video-frame__fallback"><div><p>{title} is currently unavailable.</p>{videoId && <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`} rel="noreferrer" target="_blank">Try watching on YouTube ↗</a>}</div></div></div>
  }

  return (
    <div className="video-wrap">
      <div className="video-frame">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(playableVideoId)}`}
          title={demoPreview ? 'Demonstration sample video' : title}
        />
      </div>
      <p className="video-note">{demoPreview && <>Demonstration sample: <a href={DEMO_VIDEO_SOURCE} rel="noreferrer" target="_blank">{DEMO_VIDEO_CREDIT}</a>. </>}If playback isn’t available here, <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(playableVideoId)}`} rel="noreferrer" target="_blank">watch on YouTube ↗</a></p>
    </div>
  )
}
