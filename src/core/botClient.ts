import { ChildProcess } from 'child_process'
import { AIResponse, Bot } from '../types'

export function createBotClient(botProcess: ChildProcess): Bot {
  const formatContent = (content: string) => content.replace(/\n/g, '{{NL}}')

  const sendCommand = (command: string, errorPrefix = 'Command') => {
    return new Promise<void>((resolve, reject) => {
      botProcess.stdin?.write(command, err => {
        err ? reject(`${errorPrefix} error: ${err}`) : resolve()
      })
    })
  }

  const createMediaCommand = (
    type: 'IMAGE' | 'VIDEO' | 'AUDIO',
    jid: string,
    media: string | Buffer,
    caption = '',
    isUrl = false
  ) => {
    const baseCmd = isUrl || typeof media === 'string' ? `SEND_URL_${type}` : `SEND_${type}`
    const mediaData = typeof media === 'string' ? media : media.toString('base64')
    return `${baseCmd}:${jid}|${mediaData}${type !== 'AUDIO' ? `|${formatContent(caption)}` : ''}MESSAGE_END\n`
  }

  const handleResponse = (prefix: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      let buffer = ''
      const handler = (data: Buffer) => {
        buffer += data.toString()
        if (buffer.includes(`${prefix}:`) && buffer.includes('MESSAGE_END')) {
          botProcess.stdout?.off('data', handler)
          try {
            const jsonStr = buffer.split(`${prefix}:`)[1].split('MESSAGE_END')[0].trim()
            resolve(JSON.parse(jsonStr))
          } catch (err) {
            reject(err)
          }
        }
      }
      botProcess.stdout?.on('data', handler)
    })
  }

  const ai = async (
    jid: string,
    prompt: string,
    messages: { role: string, content: string }[] = [],
    model = "GPT-4"
  ): Promise<AIResponse> => {
    const messagesStr = JSON.stringify(messages)
    const command = `CHATBOT:${jid}|${prompt}|${model}|${messagesStr}MESSAGE_END\n`
    
    await sendCommand(command, 'Chatbot')
    
    return new Promise((resolve) => {
      const handler = (data: Buffer) => {
        const message = data.toString()
        if (message.includes('CHATBOT_RESULT:')) {
          try {
            const jsonStr = message.split('CHATBOT_RESULT:')[1].split('MESSAGE_END')[0].trim()
            const result = JSON.parse(jsonStr)
            
            resolve({
              chat: result.chat || jid,
              message: result.message || result.caption || 'No response',
              command: result.command,
              query: result.query,
              caption: result.caption
            })
            
          } catch (err) {
            console.error('Failed to parse chatbot response:', err)
            resolve({
              chat: jid,
              message: 'Error processing response'
            })
          } finally {
            botProcess.stdout?.off('data', handler)
          }
        }
      }
      botProcess.stdout?.on('data', handler)
    })
  }

  return {
    ai,
    sendCommand,
    sendMessage: (jid, content) => 
      sendCommand(`SEND:${jid}|${formatContent(typeof content === 'string' ? content : '')}MESSAGE_END\n`, 'Write'),
    
    sendImage: (jid, image, caption = '', isUrl = false) => 
      sendCommand(createMediaCommand('IMAGE', jid, image, caption, isUrl), 'Image send'),
    
    sendVideo: (jid, video, caption = '', isUrl = false) => 
      sendCommand(createMediaCommand('VIDEO', jid, video, caption, isUrl), 'Video send'),
    
    sendAudio: (jid, audio, isUrl = false) => 
      sendCommand(createMediaCommand('AUDIO', jid, audio, '', isUrl), 'Audio send'),
    
    sendDocument: async (jid, data, filename, caption = '') => {
      const base64 = data.toString('base64')
      const cmd = `SEND_DOCUMENT:${jid}|${filename}|${formatContent(caption)}|${base64}MESSAGE_END\n`
      return sendCommand(cmd, 'Document send')
    },

    sendListMenu: async (jid, payload) => {
      const data = {
        jid,
        title: payload.title,
        body: payload.body,
        footer: payload.footer,
        button: payload.button,
        image: payload.image ? payload.image.toString('base64') : '',
        sections: payload.sections
      }
      return sendCommand(`SEND_LIST:${JSON.stringify(data)}MESSAGE_END\n`, 'List send')
    },
    sendInteractive: async (jid, payload) => {
      const data = { jid, ...payload }
      return sendCommand(`SEND_INTERACTIVE:${JSON.stringify(data)}MESSAGE_END\n`, 'Interactive send')
    },
    sendButtons: async (jid, payload) => {
      const data = { jid, ...payload }
      return sendCommand(`SEND_BUTTONS:${JSON.stringify(data)}MESSAGE_END\n`, 'Buttons send')
    },
    joinGroup: async (link) => {
      return sendCommand(`JOIN_GROUP:${link}MESSAGE_END\n`, 'Join group')
    },
    groupInfo: async (action, groupJid, value = '') => {
      const data = { action, groupJid, value }
      await sendCommand(`GROUP_INFO:${JSON.stringify(data)}MESSAGE_END\n`, 'Group info')
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve({ status: false, error: 'timeout' }), 15000)
        let buffer = ''
        const handler = (d: Buffer) => {
          buffer += d.toString()
          if (buffer.includes('GROUP_INFO_RESULT:') && buffer.includes('MESSAGE_END')) {
            clearTimeout(timer)
            botProcess.stdout?.off('data', handler)
            try {
              const jsonStr = buffer.split('GROUP_INFO_RESULT:')[1].split('MESSAGE_END')[0].trim()
              resolve(JSON.parse(jsonStr))
            } catch {
              resolve({ status: false, error: 'parse error' })
            }
          }
        }
        botProcess.stdout?.on('data', handler)
      })
    },
    downloadMedia: async (messageId, jid, type) => {
      await sendCommand(`DOWNLOAD_MEDIA:${messageId}|${jid}|${type}MESSAGE_END\n`)
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 15000)
        let buffer = ''
        const handler = (data: Buffer) => {
          buffer += data.toString()
          if (buffer.includes('MEDIA_DATA:') && buffer.includes('MESSAGE_END')) {
            clearTimeout(timer)
            botProcess.stdout?.off('data', handler)
            try {
              const b64 = buffer.split('MEDIA_DATA:')[1].split('MESSAGE_END')[0].trim()
              if (b64 === 'error') return resolve(null)
              resolve(Buffer.from(b64, 'base64'))
            } catch {
              resolve(null)
            }
          }
        }
        botProcess.stdout?.on('data', handler)
      })
    },

    enhanceImage: async (imageBuffer, mode = 'enhance') => {
      const base64 = imageBuffer.toString('base64')
      await sendCommand(`ENHANCE:${mode}|${base64}|0MESSAGE_END\n`)
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve({ error: 'Timeout' }), 30000)
        let buffer = ''
        const handler = (data: Buffer) => {
          buffer += data.toString()
          if (buffer.includes('DOWNLOAD_RESULT:') && buffer.includes('MESSAGE_END')) {
            clearTimeout(timer)
            botProcess.stdout?.off('data', handler)
            try {
              const jsonStr = buffer.split('DOWNLOAD_RESULT:')[1].split('MESSAGE_END')[0].trim()
              const parsed = JSON.parse(jsonStr)
              if (parsed.status && parsed.result?.url) {
                resolve({ result: { url: parsed.result.url } })
              } else {
                resolve({ error: parsed.error || 'Failed' })
              }
            } catch {
              resolve({ error: 'Parse error' })
            }
          }
        }
        botProcess.stdout?.on('data', handler)
      })
    },

    convertToSticker: async (mediaBuffer) => {
      const base64 = mediaBuffer.toString('base64')
      await sendCommand(`CONVERT_STICKER:${base64}MESSAGE_END\n`)
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 30000)
        let buffer = ''
        const handler = (data: Buffer) => {
          buffer += data.toString()
          if (buffer.includes('STICKER_RESULT:') && buffer.includes('MESSAGE_END')) {
            clearTimeout(timer)
            botProcess.stdout?.off('data', handler)
            try {
              const b64 = buffer.split('STICKER_RESULT:')[1].split('MESSAGE_END')[0].trim()
              if (b64 === 'error') return resolve(null)
              resolve(Buffer.from(b64, 'base64'))
            } catch {
              resolve(null)
            }
          }
        }
        botProcess.stdout?.on('data', handler)
      })
    },

    generateBrat: async (text) => {
      await sendCommand(`GENERATE_BRAT:${text}MESSAGE_END\n`)
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 15000)
        let buffer = ''
        const handler = (data: Buffer) => {
          buffer += data.toString()
          if (buffer.includes('BRAT_RESULT:') && buffer.includes('MESSAGE_END')) {
            clearTimeout(timer)
            botProcess.stdout?.off('data', handler)
            try {
              const b64 = buffer.split('BRAT_RESULT:')[1].split('MESSAGE_END')[0].trim()
              if (b64 === 'error') return resolve(null)
              resolve(Buffer.from(b64, 'base64'))
            } catch {
              resolve(null)
            }
          }
        }
        botProcess.stdout?.on('data', handler)
      })
    },

    sendSticker: async (jid, sticker) => {
      const base64 = sticker.toString('base64')
      return sendCommand(`SEND_STICKER:${jid}|${base64}MESSAGE_END\n`, 'Sticker send')
    },
    
    fbigDownloader: async (url) => {
      await sendCommand(`DOWNLOAD_FBIG:${url}MESSAGE_END\n`)
      const raw = await handleResponse('DOWNLOAD_RESULT')
      return raw?.result || raw
    },
    groupAction: async (action, groupJid, target) => {
      const data = { action, groupJid, target }
      await sendCommand(`GROUP_ACTION:${JSON.stringify(data)}MESSAGE_END\n`, 'Group action')
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), 20000)
        let buffer = ''
        const handler = (d: Buffer) => {
          buffer += d.toString()
          if (buffer.includes('GROUP_ACTION_RESULT:') && buffer.includes('MESSAGE_END')) {
            clearTimeout(timer)
            botProcess.stdout?.off('data', handler)
            resolve(buffer.includes('okMESSAGE_END'))
          }
        }
        botProcess.stdout?.on('data', handler)
      })
    },

    hidetag: async (groupJid, text) => {
      return sendCommand(`HIDETAG:${groupJid}|${formatContent(text)}MESSAGE_END\n`, 'Hidetag')
    },

    downloader: async (url, type, format) => {
      await sendCommand(`DOWNLOAD:${type}|${url}|${format || ''}MESSAGE_END\n`)
      return handleResponse('DOWNLOAD_RESULT')
    },

    sendOwnerVCard: async (jid) => {
      return sendCommand(`SEND_VCARD:${jid}MESSAGE_END\n`, 'VCard send')
    },
    
    sendReaction: (jid, sender, messageId, emoji) => {
      const command = `REACT:${jid}|${messageId}|${formatContent(emoji)}|${sender}MESSAGE_END\n`
      return sendCommand(command, 'Reaction')
    }
  }
}