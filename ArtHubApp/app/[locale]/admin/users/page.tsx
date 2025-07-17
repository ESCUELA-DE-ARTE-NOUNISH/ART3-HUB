import { UsersTable } from "@/components/admin/UsersTable"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function UsersPage() {
  return (
    <div className="container max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/admin" passHref>
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">App Users</h1>
        <p className="text-muted-foreground">
          View and manage all users registered on the platform.
        </p>
      </div>
      
      <UsersTable />
    </div>
  )
} 