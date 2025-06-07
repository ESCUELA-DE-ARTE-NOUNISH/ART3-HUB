"use client"
import dynamic from "next/dynamic"

// Dynamically import ConnectMenu with no SSR
const ConnectMenu = dynamic(
  () => import("@/components/connect-menu").then(mod => mod.ConnectMenu),
  { ssr: false }
)

export function Wallet() {
  return (
    <div className="fixed top-4 left-[20px] z-50">
      {/* Connect Menu - Fixed positioned for mobile, absolute for desktop */}
        <ConnectMenu />
    </div>
  )
}
