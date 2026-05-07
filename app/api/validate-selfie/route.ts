import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()
    if (!image) {
      return NextResponse.json({ valid: false, message: 'No image provided' }, { status: 400 })
    }

    // Strip the data URL prefix — keep only the base64 payload
    const base64 = image.replace(/^data:image\/(jpeg|jpg|png|webp);base64,/, '')
    // Detect media type from prefix; default to jpeg
    const mediaTypeMatch = image.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,/)
    const mediaType = (mediaTypeMatch?.[1] ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: 'Look at this image. Is there a clear human face visible? Reply with only YES or NO.',
            },
          ],
        },
      ],
    })

    const answer = (response.content[0] as { type: 'text'; text: string }).text.trim().toUpperCase()
    const valid = answer.startsWith('YES')

    return NextResponse.json({
      valid,
      message: valid ? 'Face detected' : 'Hindi malinaw ang mukha. Subukan ulit.',
    })
  } catch (err) {
    console.error('[validate-selfie]', err)
    return NextResponse.json({ valid: false, message: 'Validation error. Try again.' }, { status: 500 })
  }
}
