import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { connectDB } from '../../../lib/mongodb'
import Conversation from '../../../models/Conversation'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { conversationId, message } = await req.json()

  await connectDB()
  const conv = await Conversation.findOne({ _id: conversationId, userId: session.user.id })
  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })

  // Añadir mensaje del usuario
  conv.messages.push({ role: 'user', content: message })

  // Preparar historial para la IA (solo role + content)
  const history = conv.messages.map((m) => ({ role: m.role, content: m.content }))

  // Llamar a la IA según el modelo
  let reply = ''

  if (conv.model.startsWith('claude')) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: conv.model,
        max_tokens: 4096,
        messages: history,
      }),
    })
    const data = await res.json()
    reply = data.content?.[0]?.text || 'Sin respuesta'
  }

  else if (conv.model.startsWith('gpt')) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: conv.model,
        messages: history,
      }),
    })
    const data = await res.json()
    reply = data.choices?.[0]?.message?.content || 'Sin respuesta'
  }

  // Guardar respuesta de la IA
  conv.messages.push({ role: 'assistant', content: reply })
  conv.updatedAt = new Date()

  // Auto-título con el primer mensaje del usuario
  if (conv.messages.length === 2) {
    conv.title = message.slice(0, 50) + (message.length > 50 ? '...' : '')
  }

  await conv.save()

  return NextResponse.json({ reply })
}
