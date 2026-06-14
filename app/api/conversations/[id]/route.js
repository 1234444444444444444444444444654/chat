import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { connectDB } from '../../../../lib/mongodb'
import Conversation from '../../../../models/Conversation'

// GET /api/conversations/[id] → cargar mensajes de una conversación
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await connectDB()
  const conv = await Conversation.findOne({ _id: params.id, userId: session.user.id })
  if (!conv) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json(conv)
}

// DELETE /api/conversations/[id] → eliminar conversación
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await connectDB()
  await Conversation.deleteOne({ _id: params.id, userId: session.user.id })

  return NextResponse.json({ ok: true })
}
