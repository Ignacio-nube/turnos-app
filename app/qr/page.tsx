import { headers } from 'next/headers'
import { QRPrint } from './QRPrint'

export default async function QRPage() {
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const url = `${proto}://${host}/reservar`

  return <QRPrint url={url} />
}
