"use client"

// Prevent static generation for pages using Web3 hooks
export const dynamic = 'force-dynamic'

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Shield, AlertCircle, CheckCircle, Copy, Download, Upload, Eye, EyeOff, ArrowLeft, Info } from "lucide-react"
import { useAccount } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { useAdminService, type AdminWallet } from "@/lib/services/admin-service"
import { smartContractAdminService } from "@/lib/services/smart-contract-admin-service"
import Link from "next/link"

interface AdminTranslations {
  title: string
  description: string
  smartContractAdmin: string
  firebaseAdmins: string
  addFirebaseAdmin: string
  walletAddress: string
  label: string
  labelPlaceholder: string
  addWallet: string
  address: string
  addedBy: string
  addedAt: string
  status: string
  actions: string
  active: string
  inactive: string
  edit: string
  deactivate: string
  activate: string
  remove: string
  adminCount: string
  enterAddress: string
  enterLabel: string
  invalidAddress: string
  cannotRemoveDefault: string
  confirmRemove: string
  confirmRemoveDesc: string
  cancel: string
  confirm: string
  exportData: string
  importData: string
  backupRestore: string
  exportDesc: string
  importDesc: string
  export: string
  import: string
  selectFile: string
  noFileSelected: string
  accessDenied: string
  accessDeniedDesc: string
  defaultAdmin: string
  editAdmin: string
  updateAdmin: string
  saveChanges: string
  close: string
  backToAdmin: string
  smartContractAdminDesc: string
  firebaseAdminsDesc: string
  hybridSystemInfo: string
  smartContractOwner: string
  contractAddress: string
  network: string
}

const translations: Record<string, AdminTranslations> = {
  en: {
    title: "Admin Management",
    description: "Hybrid admin system combining smart contract security with Firebase flexibility.",
    smartContractAdmin: "Smart Contract Admin",
    firebaseAdmins: "Firebase Admin Wallets",
    addFirebaseAdmin: "Add Firebase Admin",
    walletAddress: "Wallet Address",
    label: "Label (Optional)",
    labelPlaceholder: "e.g., Developer, Support, etc.",
    addWallet: "Add Wallet",
    address: "Address",
    addedBy: "Added By",
    addedAt: "Added At",
    status: "Status",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    edit: "Edit",
    deactivate: "Deactivate",
    activate: "Activate",
    remove: "Remove",
    adminCount: "Firebase Administrators",
    enterAddress: "Enter wallet address (0x...)",
    enterLabel: "Enter optional label",
    invalidAddress: "Invalid wallet address format",
    cannotRemoveDefault: "Cannot remove default administrator",
    confirmRemove: "Confirm Removal",
    confirmRemoveDesc: "Are you sure you want to remove this administrator? This action cannot be undone.",
    cancel: "Cancel",
    confirm: "Confirm",
    exportData: "Export Data",
    importData: "Import Data",
    backupRestore: "Backup & Restore",
    exportDesc: "Download Firebase admin wallets as JSON backup",
    importDesc: "Upload JSON backup to restore Firebase admin wallets",
    export: "Export",
    import: "Import",
    selectFile: "Select File",
    noFileSelected: "No file selected",
    accessDenied: "Access Denied",
    accessDeniedDesc: "You need administrator privileges to access this page.",
    defaultAdmin: "Default Admin",
    editAdmin: "Edit Administrator",
    updateAdmin: "Update Administrator",
    saveChanges: "Save Changes",
    close: "Close",
    backToAdmin: "← Back to Admin Panel",
    smartContractAdminDesc: "Primary admin with contract ownership and upgrade authority",
    firebaseAdminsDesc: "Secondary admins with platform management access",
    hybridSystemInfo: "This system combines immutable smart contract admin security with flexible Firebase admin management.",
    smartContractOwner: "Contract Owner",
    contractAddress: "Contract Address",
    network: "Network"
  },
  es: {
    title: "Gestión de Administradores",
    description: "Sistema híbrido de admin que combina seguridad de contratos inteligentes con flexibilidad de Firebase.",
    smartContractAdmin: "Admin de Contrato Inteligente",
    firebaseAdmins: "Billeteras Admin de Firebase",
    addFirebaseAdmin: "Agregar Admin de Firebase",
    walletAddress: "Dirección de Billetera",
    label: "Etiqueta (Opcional)",
    labelPlaceholder: "ej., Desarrollador, Soporte, etc.",
    addWallet: "Agregar Billetera",
    address: "Dirección",
    addedBy: "Agregado Por",
    addedAt: "Agregado El",
    status: "Estado",
    actions: "Acciones",
    active: "Activo",
    inactive: "Inactivo",
    edit: "Editar",
    deactivate: "Desactivar",
    activate: "Activar",
    remove: "Eliminar",
    adminCount: "Administradores de Firebase",
    enterAddress: "Ingrese dirección de billetera (0x...)",
    enterLabel: "Ingrese etiqueta opcional",
    invalidAddress: "Formato de dirección de billetera inválido",
    cannotRemoveDefault: "No se puede eliminar administrador predeterminado",
    confirmRemove: "Confirmar Eliminación",
    confirmRemoveDesc: "¿Está seguro de que desea eliminar este administrador? Esta acción no se puede deshacer.",
    cancel: "Cancelar",
    confirm: "Confirmar",
    exportData: "Exportar Datos",
    importData: "Importar Datos",
    backupRestore: "Respaldo y Restauración",
    exportDesc: "Descargar billeteras admin de Firebase como respaldo JSON",
    importDesc: "Subir respaldo JSON para restaurar billeteras admin de Firebase",
    export: "Exportar",
    import: "Importar",
    selectFile: "Seleccionar Archivo",
    noFileSelected: "Ningún archivo seleccionado",
    accessDenied: "Acceso Denegado",
    accessDeniedDesc: "Necesita privilegios de administrador para acceder a esta página.",
    defaultAdmin: "Admin Predeterminado",
    editAdmin: "Editar Administrador",
    updateAdmin: "Actualizar Administrador",
    saveChanges: "Guardar Cambios",
    close: "Cerrar",
    backToAdmin: "← Volver al Panel de Admin",
    smartContractAdminDesc: "Admin principal con propiedad del contrato y autoridad de actualización",
    firebaseAdminsDesc: "Admins secundarios con acceso a gestión de plataforma",
    hybridSystemInfo: "Este sistema combina seguridad inmutable de admin de contrato inteligente con gestión flexible de admin de Firebase.",
    smartContractOwner: "Propietario del Contrato",
    contractAddress: "Dirección del Contrato",
    network: "Red"
  }
}

// Helper function to format date in EST timezone
const formatDateTimeEST = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

export default function AdminManagementPage() {
  const params = useParams()
  const locale = (params?.locale as string) || defaultLocale
  const t = translations[locale] || translations.en
  const router = useRouter()
  
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const adminService = useAdminService()
  
  // State management
  const [firebaseAdmins, setFirebaseAdmins] = useState<AdminWallet[]>([])
  const [smartContractInfo, setSmartContractInfo] = useState<any>(null)
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false)
  const [newAdminAddress, setNewAdminAddress] = useState("")
  const [newAdminLabel, setNewAdminLabel] = useState("")
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [adminToRemove, setAdminToRemove] = useState<AdminWallet | null>(null)
  const [editingAdmin, setEditingAdmin] = useState<AdminWallet | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editLabel, setEditLabel] = useState("")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Redirect to landing page only if user explicitly disconnects
  useEffect(() => {
    const checkConnection = setTimeout(() => {
      if (!isConnected) {
        router.push('/')
      }
      setHasCheckedAuth(true)
    }, 1000)

    return () => clearTimeout(checkConnection)
  }, [isConnected, router])

  // Load admin data and check permissions
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        // Check admin status with both systems
        if (address) {
          const [isSmartContractAdmin, isFirebaseAdmin] = await Promise.all([
            smartContractAdminService.isAdmin(address),
            adminService.isAdmin(address)
          ])
          setIsCurrentUserAdmin(isSmartContractAdmin || isFirebaseAdmin)

          // Load smart contract info
          if (isSmartContractAdmin) {
            try {
              const contractInfo = await smartContractAdminService.getAdminInfo()
              setSmartContractInfo(contractInfo)
            } catch (error) {
              console.error('Error loading smart contract info:', error)
            }
          }
        } else {
          setIsCurrentUserAdmin(false)
        }
        
        // Load Firebase admin wallets
        const adminWallets = await adminService.getAllAdmins()
        setFirebaseAdmins(adminWallets)
        setHasCheckedAuth(true)
      } catch (error) {
        console.error('Error loading admin data:', error)
        // Fallback to sync methods if Firebase is unavailable
        if (address) {
          const isSmartAdmin = smartContractAdminService.isAdminSync(address)
          const isFirebaseAdmin = adminService.isAdminSync(address)
          setIsCurrentUserAdmin(isSmartAdmin || isFirebaseAdmin)
        }
        setFirebaseAdmins(adminService.getAllAdminsSync())
        setHasCheckedAuth(true)
      }
    }
    
    loadAdminData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadAdminData, 30000)
    return () => clearInterval(interval)
  }, [address, adminService])

  // Show loading state until auth check is complete
  if (!hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-20">
          <div className="max-w-2xl mx-auto text-center">
            Loading...
          </div>
        </main>
      </div>
    )
  }

  // Access control - redirect if not admin
  if (!isCurrentUserAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8 pt-20">
          <div className="max-w-2xl mx-auto">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <div className="font-semibold">{t.accessDenied}</div>
                <div className="mt-1">{t.accessDeniedDesc}</div>
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    )
  }

  // Handle adding new Firebase admin
  const handleAddFirebaseAdmin = async () => {
    if (!newAdminAddress.trim()) {
      toast({
        title: t.invalidAddress,
        description: t.enterAddress,
        variant: "destructive",
      })
      return
    }

    setIsAddingAdmin(true)
    
    try {
      const result = await adminService.addAdmin(newAdminAddress.trim(), address || "unknown", newAdminLabel.trim() || undefined)
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        const updatedAdmins = await adminService.getAllAdmins()
        setFirebaseAdmins(updatedAdmins)
        setNewAdminAddress("")
        setNewAdminLabel("")
        setShowAddDialog(false)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Exception caught:', error)
      toast({
        title: "Error",
        description: "Failed to add administrator",
        variant: "destructive",
      })
    } finally {
      setIsAddingAdmin(false)
    }
  }

  // Handle editing Firebase admin
  const handleEditAdmin = (admin: AdminWallet) => {
    setEditingAdmin(admin)
    setEditLabel(admin.label || "")
    setShowEditDialog(true)
  }

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return

    try {
      const result = await adminService.updateAdmin(editingAdmin.id, { label: editLabel.trim() || undefined }, address || "unknown")
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        const updatedAdmins = await adminService.getAllAdmins()
        setFirebaseAdmins(updatedAdmins)
        setShowEditDialog(false)
        setEditingAdmin(null)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update administrator",
        variant: "destructive",
      })
    }
  }

  // Handle toggling Firebase admin status
  const handleToggleAdmin = async (admin: AdminWallet) => {
    try {
      const result = await adminService.updateAdmin(admin.id, { isActive: !admin.isActive }, address || "unknown")
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        const updatedAdmins = await adminService.getAllAdmins()
        setFirebaseAdmins(updatedAdmins)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update administrator",
        variant: "destructive",
      })
    }
  }

  // Handle removing Firebase admin
  const handleRemoveAdmin = async () => {
    if (!adminToRemove) return

    try {
      const result = await adminService.removeAdmin(adminToRemove.id, address || "unknown")
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        const updatedAdmins = await adminService.getAllAdmins()
        setFirebaseAdmins(updatedAdmins)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove administrator",
        variant: "destructive",
      })
    } finally {
      setShowRemoveDialog(false)
      setAdminToRemove(null)
    }
  }

  // Handle export
  const handleExport = async () => {
    try {
      const data = await adminService.exportAdmins()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `art3hub-firebase-admins-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Firebase admin wallets exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export Firebase admin wallets",
        variant: "destructive",
      })
    }
  }

  // Handle import
  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      })
      return
    }

    try {
      const text = await importFile.text()
      const result = await adminService.importAdmins(text, address || "unknown")
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        const updatedAdmins = await adminService.getAllAdmins()
        setFirebaseAdmins(updatedAdmins)
        setImportFile(null)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import Firebase admin wallets",
        variant: "destructive",
      })
    }
  }

  // Handle copy address
  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive",
      })
    }
  }

  const activeAdminCount = firebaseAdmins.filter(admin => admin.isActive).length
  const totalAdminCount = firebaseAdmins.length

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <Link href={`/${locale}/admin`} className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t.backToAdmin}
            </Link>
          </div>

          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t.title}
              </h1>
              <p className="text-lg text-gray-600">
                {t.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">{t.adminCount}</div>
              <div className="text-2xl font-bold text-gray-900">{activeAdminCount}/{totalAdminCount}</div>
            </div>
          </div>

          {/* Hybrid System Info */}
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              <div className="font-semibold mb-1">Hybrid Admin System</div>
              <div>{t.hybridSystemInfo}</div>
            </AlertDescription>
          </Alert>

          {/* Smart Contract Admin Info */}
          {smartContractInfo && (
            <Card className="mb-8 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  {t.smartContractAdmin}
                </CardTitle>
                <CardDescription>
                  {t.smartContractAdminDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">{t.smartContractOwner}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {smartContractInfo.adminWallet.slice(0, 6)}...{smartContractInfo.adminWallet.slice(-4)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyAddress(smartContractInfo.adminWallet)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">Factory {t.contractAddress}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {smartContractInfo.factoryOwner.slice(0, 6)}...{smartContractInfo.factoryOwner.slice(-4)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyAddress(smartContractInfo.factoryOwner)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-600">{t.network}</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{smartContractInfo.network}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Firebase Admin Wallets Management */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t.firebaseAdmins}
                  </CardTitle>
                  <CardDescription>
                    {t.firebaseAdminsDesc}
                  </CardDescription>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-pink-500 hover:bg-pink-600">
                      <Plus className="h-4 w-4 mr-2" />
                      {t.addFirebaseAdmin}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.addFirebaseAdmin}</DialogTitle>
                      <DialogDescription>
                        Add a new Firebase administrator wallet to the platform
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="walletAddress">{t.walletAddress}</Label>
                        <Input
                          id="walletAddress"
                          placeholder={t.enterAddress}
                          value={newAdminAddress}
                          onChange={(e) => setNewAdminAddress(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="label">{t.label}</Label>
                        <Input
                          id="label"
                          placeholder={t.labelPlaceholder}
                          value={newAdminLabel}
                          onChange={(e) => setNewAdminLabel(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        {t.cancel}
                      </Button>
                      <Button 
                        onClick={handleAddFirebaseAdmin}
                        disabled={isAddingAdmin}
                        className="bg-pink-500 hover:bg-pink-600"
                      >
                        {isAddingAdmin ? "Adding..." : t.addWallet}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.address}</TableHead>
                    <TableHead>{t.label}</TableHead>
                    <TableHead>{t.addedBy}</TableHead>
                    <TableHead>{t.addedAt}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {firebaseAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {admin.address.slice(0, 6)}...{admin.address.slice(-4)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyAddress(admin.address)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {admin.label || (
                          admin.address.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_WALLET || "").toLowerCase() 
                            ? t.defaultAdmin 
                            : "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">
                          {admin.addedBy === "system" ? "System" : `${admin.addedBy.slice(0, 6)}...${admin.addedBy.slice(-4)}`}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDateTimeEST(admin.addedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.isActive ? "default" : "secondary"}>
                          {admin.isActive ? t.active : t.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAdmin(admin)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {admin.address.toLowerCase() !== (process.env.NEXT_PUBLIC_ADMIN_WALLET || "").toLowerCase() && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleAdmin(admin)}
                              >
                                {admin.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setAdminToRemove(admin)
                                  setShowRemoveDialog(true)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Backup & Restore */}
          <Card>
            <CardHeader>
              <CardTitle>{t.backupRestore}</CardTitle>
              <CardDescription>
                Export and import Firebase administrator wallet configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">{t.exportData}</h4>
                  <p className="text-sm text-gray-600 mb-4">{t.exportDesc}</p>
                  <Button onClick={handleExport} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {t.export}
                  </Button>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t.importData}</h4>
                  <p className="text-sm text-gray-600 mb-4">{t.importDesc}</p>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <Button 
                      onClick={handleImport} 
                      variant="outline"
                      disabled={!importFile}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t.import}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Admin Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editAdmin}</DialogTitle>
            <DialogDescription>
              Update administrator label and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.walletAddress}</Label>
              <Input value={editingAdmin?.address || ""} disabled />
            </div>
            <div>
              <Label htmlFor="editLabel">{t.label}</Label>
              <Input
                id="editLabel"
                placeholder={t.labelPlaceholder}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleUpdateAdmin} className="bg-pink-500 hover:bg-pink-600">
              {t.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.confirmRemove}</DialogTitle>
            <DialogDescription>
              {t.confirmRemoveDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={handleRemoveAdmin}>
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <br />
      <br />
      <br />
    </div>
  )
}