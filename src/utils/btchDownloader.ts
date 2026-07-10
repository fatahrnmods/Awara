import { igdl } from 'btch-downloader'

export interface MediaItem {
  url: string
  isVideo: boolean
}

function detectFromUrl(url: string): boolean {
  try {
    // URL formatnya: https://d.rapidcdn.app/v2?token=<JWT>
    const tokenMatch = url.match(/token=([^&]+)/)
    if (!tokenMatch) return url.toLowerCase().includes('.mp4')

    const token = tokenMatch[1]
    const payloadB64 = token.split('.')[1]
    const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf-8')
    const payload = JSON.parse(payloadJson)

    const filename: string = payload.filename || payload.url || ''
    return filename.toLowerCase().includes('.mp4')
  } catch {
    return url.toLowerCase().includes('.mp4')
  }
}

export async function downloadInstagram(url: string): Promise<MediaItem[]> {
  const res = await igdl(url)
  if (!res.status || !res.result?.length) {
    throw new Error('Failed to fetch Instagram content')
  }

  return res.result.map((item: any) => ({
    url: item.url,
    isVideo: detectFromUrl(item.url)
  }))
}

export async function downloadPinterest(url: string): Promise<{ url: string; isVideo: boolean }> {
  const { pinterest } = await import('btch-downloader')
  const res: any = await pinterest(url)
  if (!res.status || !res.result?.result) {
    throw new Error('Failed to fetch Pinterest content')
  }

  const data = res.result.result

  if (data.video_url) {
    return { url: data.video_url, isVideo: true }
  }

  if (data.videos?.video?.[0]?.url) {
    return { url: data.videos.video[0].url, isVideo: true }
  }

  let imageUrl = data.images?.orig?.url || data.image
  if (!imageUrl) {
    throw new Error('No media URL found in Pinterest response')
  }

  // Ganti path resolusi kecil (mis. /236x/) ke /originals/ untuk kualitas penuh
  imageUrl = imageUrl.replace(/\/\d+x(?:\d+)?\//, '/originals/')

  return { url: imageUrl, isVideo: false }
}

export async function downloadSpotify(url: string) {
  const { spotify } = await import('btch-downloader')
  const res: any = await spotify(url)
  if (!res.status || !res.result) throw new Error('Failed to fetch Spotify content')
  return res.result
}

export async function downloadMediafire(url: string) {
  const { mediafire } = await import('btch-downloader')
  const res: any = await mediafire(url)
  if (!res.status || !res.result) throw new Error('Failed to fetch Mediafire content')
  return res.result
}

export async function downloadThreads(url: string) {
  const { threads } = await import('btch-downloader')
  const res: any = await threads(url)
  if (!res.status || !res.result) throw new Error('Failed to fetch Threads content')
  return res.result
}

export async function downloadCapcut(url: string) {
  const { capcut } = await import('btch-downloader')
  const res: any = await capcut(url)
  if (!res.status || !res.result) throw new Error('Failed to fetch Capcut content')
  return res.result
}
