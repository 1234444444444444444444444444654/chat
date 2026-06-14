import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { connectDB } from '../../../lib/mongodb'
import Conversation from '../../../models/Conversation'

// GET /api/conversations → listar conversaciones del usuario
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await connectDB()
  const convs = await Conversation.find({ userId: session.user.id })
    .select('_id title model updatedAt')
    .sort({ updatedAt: -1 })

  return NextResponse.json(convs)
}

// POST /api/conversations → crear nueva conversación
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { model } = await req.json()
  await connectDB()

  const conv = await Conversation.create({
    userId: session.user.id,
    model: model || 'claude-sonnet-4-6',
  })

  return NextResponse.json(conv)
}
