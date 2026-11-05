const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.m.youtube.com', 'youtu.be', 'www.youtu.be'])
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

interface YouTubeUrlResult {
  id: string
  error: string
}

export function parseYouTubeVideoId(value: string): YouTubeUrlResult {
  if (!value?.trim()) return { id: '', error: '' }

  let url
  try {
    url = new URL(value.trim())
  } catch {
    return { id: '', error: 'Enter a complete YouTube URL.' }
  }

  if (url.protocol !== 'https:' || url.port || url.username || url.password || !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) {
    return { id: '', error: 'Use a youtube.com or youtu.be link.' }
  }

  let candidate = ''
  if (url.hostname.toLowerCase() === 'youtu.be' || url.hostname.toLowerCase() === 'www.youtu.be') {
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length === 1) candidate = parts[0]
  } else if (url.pathname === '/watch') {
    candidate = url.searchParams.get('v') || ''
  } else {
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (pathParts.length === 2 && pathParts[0] === 'shorts') candidate = pathParts[1]
  }

  if (!VIDEO_ID_PATTERN.test(candidate)) {
    return { id: '', error: 'That link does not contain a valid YouTube video ID.' }
  }
  return { id: candidate, error: '' }
}
