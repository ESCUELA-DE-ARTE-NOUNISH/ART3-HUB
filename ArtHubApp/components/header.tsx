import { ChevronLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface HeaderProps {
  title: string
  showBack?: boolean
  backUrl?: string
}

export default function Header({ title, showBack = true, backUrl = "/" }: HeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center">
        {showBack && (
          <Link href={backUrl} className="mr-2">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        )}
        <h1 className="text-xl font-medium">{title}</h1>
      </div>
      <div className="flex items-center">
        <Image
          src="/images/logo.png"
          alt="Escuela de Arte Nounish Logo"
          width={40}
          height={40}
          className="rounded-full"
        />
      </div>
    </div>
  )
}
