import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from '../lib/auth'
import SessionProvider from './SessionProvider'

export const metadata = {
  title: 'ChatApp',
  description: 'Tu asistente de IA personal',
}

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="es">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
