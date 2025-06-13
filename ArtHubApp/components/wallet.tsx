"use client"
import dynamic from "next/dynamic"

// Dynamically import ConnectMenu with no SSR
const ConnectMenu = dynamic(
  () => import("@/components/connect-menu").then(mod => mod.ConnectMenu),
  { ssr: false }
)

export function Wallet() {
  return (
    <div>
      {/* Connect Menu - Now positioned within header container */}
      <ConnectMenu />
    </div>
  )
}
