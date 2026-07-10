export interface Bot {
  sendCommand: (command: string, errorPrefix?: string) => Promise<void>
  sendMessage: (jid: string, message: string) => Promise<void>
  convertToSticker: (mediaBuffer: Buffer) => Promise<Buffer | null>
  sendSticker: (jid: string, sticker: Buffer) => Promise<void>
  sendOwnerVCard: (jid: string) => Promise<void>
  generateBrat: (text: string) => Promise<Buffer | null>
  groupInfo: (action: 'setname' | 'setdesc' | 'getlink' | 'revoke', groupJid: string, value?: string) => Promise<{ status: boolean; link?: string; error?: string }>
  sendListMenu: (jid: string, payload: {
    title: string
    body: string
    footer: string
    button: string
    image?: Buffer
    sections: Array<{
      title: string
      rows: Array<{ id: string; title: string; description: string }>
    }>
  }) => Promise<void>
  sendInteractive: (jid: string, payload: {
    header: string
    body: string
    footer: string
    buttons: Array<{ name: string; params: string }>
  }) => Promise<void>
  sendButtons: (jid: string, payload: {
    title: string
    body: string
    footer: string
    buttons: Array<{ id: string; text: string }>
  }) => Promise<void>
  sendImage: (
    jid: string, 
    image: Buffer | string, 
    caption?: string, 
    isUrl?: boolean
  ) => Promise<void>
  sendVideo: (
    jid: string, 
    video: Buffer | string, 
    caption?: string, 
    isUrl?: boolean
  ) => Promise<void>
  sendAudio: (
    jid: string, 
    audio: Buffer | string, 
    isUrl?: boolean
  ) => Promise<void>
  sendDocument: (jid: string, data: Buffer, filename: string, caption?: string) => Promise<void>
  sendReaction: (
    jid: string,
    sender: string,
    messageId: string,
    emoji: string
  ) => Promise<void>
  joinGroup: (link: string) => Promise<void>
  ai: (
    jid: string,
    prompt: string,
    messages?: Array<{
      role: string
      content: string
    }>,
    model?: string
  ) => Promise<AIResponse>
  downloadMedia: (
    messageId: string,
    jid: string,
    type: 'quoted' | 'direct'
  ) => Promise<Buffer | null>
  enhanceImage: (
    imageBuffer: Buffer,
    mode?: string
  ) => Promise<{ result?: { url: string }, error?: string }>
  fbigDownloader: (url: string) => Promise<{
    status: boolean
    title?: string
    video?: string
    images?: string[]
    error?: string
  }>
  groupAction: (action: 'kick' | 'promote' | 'demote', groupJid: string, target: string) => Promise<boolean>
  hidetag: (groupJid: string, text: string) => Promise<void>
  downloader: (
    url: string, 
    type: 'tiktok' | 'youtube', 
    format?: 'mp3' | 'mp4'
  ) => Promise<DownloadResult>
}

export interface DownloadResult {
  status: boolean
  type?: string
  result?: {
    video?: string
    images?: string[]
    music?: string
    wm?: string
    url?: string
    title?: string
    duration?: number
    [key: string]: any
  }
  error?: string
}

export interface AIResponse {
  chat: string
  message: string
  command?: string
  query?: string
  caption?: string
  isGroup?: boolean
  messageId?: string
}

export interface CommandContext {
  chat: string
  from: string
  sender: string
  text: string
  pushName?: string
  isGroup?: boolean
  messageId: string
  isImage?: boolean
  isQuotedImage?: boolean
  isSticker?: boolean
  isQuotedSticker?: boolean
  quotedMessage?: QuotedMessage
}

export interface QuotedMessage {
  messageId: string
  from: string
  isImage?: boolean
  isVideo?: boolean
  isDocument?: boolean
}

export interface CommandResponse {
  text: string
  mentions?: string[]
}

export interface CommandMeta {
  alias?: string[]
  filePath: string
  loadedAt?: Date
  lastModified: number
  size: number
  category: string
}

export interface Command {
  name: string
  alias?: string[]
  category: string
  description?: string
  wait?: boolean
  handler: (
    bot: Bot,
    args: string[],
    context: CommandContext
  ) => Promise<CommandResponse | void> | CommandResponse | void
  meta?: Partial<CommandMeta>
}

export interface CommandWithMeta extends Command {
  meta: CommandMeta
  wait?: boolean
}