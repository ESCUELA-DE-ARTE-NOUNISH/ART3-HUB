"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
import { Plus, Edit, Trash2, Shield, AlertCircle, CheckCircle, Copy, Download, Upload, Eye, EyeOff, BarChart3 } from "lucide-react"
import { useAccount } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { useAdminService, type AdminWallet } from "@/lib/services/admin-service"
import { UserAnalyticsDashboard } from "@/components/admin/UserAnalyticsDashboard"
import { UsersList } from "@/components/admin/UsersList"

interface AdminTranslations {
  title: string
  description: string
  adminWallets: string
  addAdmin: string
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
  userAnalytics: string
  adminManagement: string
}

const translations: Record<string, AdminTranslations> = {
  en: {
    title: "Admin Panel",
    description: "Manage administrator wallets and platform controls.",
    adminWallets: "Administrator Wallets",
    addAdmin: "Add Administrator",
    walletAddress: "Wallet Address",
    label: "Label (Optional)",
    labelPlaceholder: "e.g., Main Admin, Developer, etc.",
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
    adminCount: "Total Administrators",
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
    exportDesc: "Download administrator wallets as JSON backup",
    importDesc: "Upload JSON backup to restore administrator wallets",
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
    userAnalytics: "User Analytics",
    adminManagement: "Admin Management"
  },
  es: {
    title: "Panel de Administración",
    description: "Gestionar billeteras de administrador y controles de plataforma.",
    adminWallets: "Billeteras de Administrador",
    addAdmin: "Agregar Administrador",
    walletAddress: "Dirección de Billetera",
    label: "Etiqueta (Opcional)",
    labelPlaceholder: "ej., Admin Principal, Desarrollador, etc.",
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
    adminCount: "Total de Administradores",
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
    exportDesc: "Descargar billeteras de administrador como respaldo JSON",
    importDesc: "Subir respaldo JSON para restaurar billeteras de administrador",
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
    userAnalytics: "Analíticas de Usuario",
    adminManagement: "Gestión de Administradores"
  },
  pt: {
    title: "Painel de Administração",
    description: "Gerenciar carteiras de administrador e controles da plataforma.",
    adminWallets: "Carteiras de Administrador",
    addAdmin: "Adicionar Administrador",
    walletAddress: "Endereço da Carteira",
    label: "Rótulo (Opcional)",
    labelPlaceholder: "ex., Admin Principal, Desenvolvedor, etc.",
    addWallet: "Adicionar Carteira",
    address: "Endereço",
    addedBy: "Adicionado Por",
    addedAt: "Adicionado Em",
    status: "Status",
    actions: "Ações",
    active: "Ativo",
    inactive: "Inativo",
    edit: "Editar",
    deactivate: "Desativar",
    activate: "Ativar",
    remove: "Remover",
    adminCount: "Total de Administradores",
    enterAddress: "Digite endereço da carteira (0x...)",
    enterLabel: "Digite rótulo opcional",
    invalidAddress: "Formato de endereço de carteira inválido",
    cannotRemoveDefault: "Não é possível remover administrador padrão",
    confirmRemove: "Confirmar Remoção",
    confirmRemoveDesc: "Tem certeza de que deseja remover este administrador? Esta ação não pode ser desfeita.",
    cancel: "Cancelar",
    confirm: "Confirmar",
    exportData: "Exportar Dados",
    importData: "Importar Dados",
    backupRestore: "Backup e Restauração",
    exportDesc: "Baixar carteiras de administrador como backup JSON",
    importDesc: "Enviar backup JSON para restaurar carteiras de administrador",
    export: "Exportar",
    import: "Importar",
    selectFile: "Selecionar Arquivo",
    noFileSelected: "Nenhum arquivo selecionado",
    accessDenied: "Acesso Negado",
    accessDeniedDesc: "Você precisa de privilégios de administrador para acessar esta página.",
    defaultAdmin: "Admin Padrão",
    editAdmin: "Editar Administrador",
    updateAdmin: "Atualizar Administrador",
    saveChanges: "Salvar Alterações",
    close: "Fechar",
    userAnalytics: "Análise de Usuários",
    adminManagement: "Gerenciamento de Administradores"
  },
  fr: {
    title: "Panneau d'Administration",
    description: "Gérer les portefeuilles d'administrateur et les contrôles de plateforme.",
    adminWallets: "Portefeuilles d'Administrateur",
    addAdmin: "Ajouter un Administrateur",
    walletAddress: "Adresse du Portefeuille",
    label: "Étiquette (Optionnel)",
    labelPlaceholder: "ex., Admin Principal, Développeur, etc.",
    addWallet: "Ajouter un Portefeuille",
    address: "Adresse",
    addedBy: "Ajouté Par",
    addedAt: "Ajouté Le",
    status: "Statut",
    actions: "Actions",
    active: "Actif",
    inactive: "Inactif",
    edit: "Modifier",
    deactivate: "Désactiver",
    activate: "Activer",
    remove: "Supprimer",
    adminCount: "Total des Administrateurs",
    enterAddress: "Entrez l'adresse du portefeuille (0x...)",
    enterLabel: "Entrez une étiquette optionnelle",
    invalidAddress: "Format d'adresse de portefeuille invalide",
    cannotRemoveDefault: "Impossible de supprimer l'administrateur par défaut",
    confirmRemove: "Confirmer la Suppression",
    confirmRemoveDesc: "Êtes-vous sûr de vouloir supprimer cet administrateur ? Cette action ne peut pas être annulée.",
    cancel: "Annuler",
    confirm: "Confirmer",
    exportData: "Exporter les Données",
    importData: "Importer les Données",
    backupRestore: "Sauvegarde et Restauration",
    exportDesc: "Télécharger les portefeuilles d'administrateur comme sauvegarde JSON",
    importDesc: "Téléverser une sauvegarde JSON pour restaurer les portefeuilles d'administrateur",
    export: "Exporter",
    import: "Importer",
    selectFile: "Sélectionner un Fichier",
    noFileSelected: "Aucun fichier sélectionné",
    accessDenied: "Accès Refusé",
    accessDeniedDesc: "Vous avez besoin de privilèges d'administrateur pour accéder à cette page.",
    defaultAdmin: "Admin par Défaut",
    editAdmin: "Modifier l'Administrateur",
    updateAdmin: "Mettre à Jour l'Administrateur",
    saveChanges: "Enregistrer les Modifications",
    close: "Fermer",
    userAnalytics: "Analyse des Utilisateurs",
    adminManagement: "Gestion des Administrateurs"
  }
}

export default function AdminPage() {
  const params = useParams()
  const locale = (params?.locale as string) || defaultLocale
  const t = translations[locale] || translations.en
  
  const { address } = useAccount()
  const { toast } = useToast()
  const adminService = useAdminService()
  
  // State management
  const [admins, setAdmins] = useState<AdminWallet[]>([])
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

  // Load admin data and check permissions
  useEffect(() => {
    const loadAdminData = () => {
      setIsCurrentUserAdmin(adminService.isAdmin(address))
      setAdmins(adminService.getAllAdmins())
    }
    
    loadAdminData()
    
    // Refresh data every 5 seconds
    const interval = setInterval(loadAdminData, 5000)
    return () => clearInterval(interval)
  }, [address, adminService])

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

  // Handle adding new admin
  const handleAddAdmin = async () => {
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
      const result = adminService.addAdmin(newAdminAddress.trim(), address || "unknown", newAdminLabel.trim() || undefined)
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setAdmins(adminService.getAllAdmins())
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
      toast({
        title: "Error",
        description: "Failed to add administrator",
        variant: "destructive",
      })
    } finally {
      setIsAddingAdmin(false)
    }
  }

  // Handle editing admin
  const handleEditAdmin = (admin: AdminWallet) => {
    setEditingAdmin(admin)
    setEditLabel(admin.label || "")
    setShowEditDialog(true)
  }

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return

    try {
      const result = adminService.updateAdmin(editingAdmin.id, { label: editLabel.trim() || undefined }, address || "unknown")
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setAdmins(adminService.getAllAdmins())
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

  // Handle toggling admin status
  const handleToggleAdmin = async (admin: AdminWallet) => {
    try {
      const result = adminService.updateAdmin(admin.id, { isActive: !admin.isActive }, address || "unknown")
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setAdmins(adminService.getAllAdmins())
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

  // Handle removing admin
  const handleRemoveAdmin = async () => {
    if (!adminToRemove) return

    try {
      const result = adminService.removeAdmin(adminToRemove.id, address || "unknown")
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setAdmins(adminService.getAllAdmins())
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
  const handleExport = () => {
    try {
      const data = adminService.exportAdmins()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `art3hub-admin-wallets-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Admin wallets exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export admin wallets",
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
      const result = adminService.importAdmins(text, address || "unknown")
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        setAdmins(adminService.getAllAdmins())
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
        description: "Failed to import admin wallets",
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

  const activeAdminCount = adminService.getAdminCount().active
  const totalAdminCount = adminService.getAdminCount().total

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
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

          {/* Admin Wallets Management */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t.adminWallets}
                  </CardTitle>
                  <CardDescription>
                    Manage administrator wallet addresses and permissions
                  </CardDescription>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-pink-500 hover:bg-pink-600">
                      <Plus className="h-4 w-4 mr-2" />
                      {t.addAdmin}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.addAdmin}</DialogTitle>
                      <DialogDescription>
                        Add a new administrator wallet to the platform
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
                        onClick={handleAddAdmin} 
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
                  {admins.map((admin) => (
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
                        {new Date(admin.addedAt).toLocaleDateString()}
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

          {/* App Users Management */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    App Users
                  </CardTitle>
                  <CardDescription>
                    View and manage all users of the platform. Access user details, profile status, and more.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Import the UsersList component at the top of the file */}
              <UsersList pageSize={10} />
            </CardContent>
          </Card>

          {/* Backup & Restore */}
          <Card>
            <CardHeader>
              <CardTitle>{t.backupRestore}</CardTitle>
              <CardDescription>
                Export and import administrator wallet configurations
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
    </div>
  )
}