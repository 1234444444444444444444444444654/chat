import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '../../../../lib/mongodb'
import User from '../../../../models/User'

export async function POST(req) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Rellena todos los campos' }, { status: 400 })
    }

    await connectDB()

    const exists = await User.findOne({ email })
    if (exists) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    await User.create({ name, email, password: hashed })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
