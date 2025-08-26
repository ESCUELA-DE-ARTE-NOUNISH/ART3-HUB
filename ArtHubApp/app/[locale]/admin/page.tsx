"use client"

// Prevent static generation for pages using Web3 hooks
export const dynamic = 'force-dynamic'

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertCircle, CheckCircle, Copy, BarChart3, ExternalLink, Info } from "lucide-react"
import { useAccount } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { useSmartContractAdminService, type AdminPermissions, type AdminInfo } from "@/lib/services/smart-contract-admin-service"
import { useAdminService } from "@/lib/services/admin-service"
import { UserAnalyticsDashboard } from "@/components/admin/UserAnalyticsDashboard"
import { UsersList } from "@/components/admin/UsersList"

interface AdminTranslations {
  title: string
  description: string
  adminSystem: string
  smartContractAdmin: string
  contractInfo: string
  adminStatus: string
  userManagement: string
  claimableNfts: string
  adminManagement: string
  manageAdmins: string
  accessDenied: string
  accessDeniedDesc: string
  adminWallet: string
  factoryOwner: string
  subscriptionOwner: string
  network: string
  contractAddresses: string
  isAdmin: string
  isFactoryOwner: string
  isSubscriptionOwner: string
  isAdminWallet: string
  isFirebaseAdmin: string
  yes: string
  no: string
  viewContract: string
  refreshStatus: string
  loading: string
  error: string
  userAnalytics: string
}

const translations: Record<string, AdminTranslations> = {
  en: {
    title: "Admin Panel",
    description: "Smart contract-based administrator controls and platform management.",
    adminSystem: "Smart Contract Admin System",
    smartContractAdmin: "Production Admin Validation",
    contractInfo: "Contract Information",
    adminStatus: "Admin Status",
    userManagement: "User Management",
    claimableNfts: "Claimable NFTs",
    adminManagement: "Admin Management",
    manageAdmins: "Manage Administrators",
    accessDenied: "Access Denied",
    accessDeniedDesc: "You need administrator privileges to access this page. Admin status is verified on-chain.",
    adminWallet: "Admin Wallet",
    factoryOwner: "Factory Owner",
    subscriptionOwner: "Subscription Owner", 
    network: "Network",
    contractAddresses: "Contract Addresses",
    isAdmin: "Is Admin",
    isFactoryOwner: "Is Factory Owner",
    isSubscriptionOwner: "Is Subscription Owner",
    isAdminWallet: "Is Admin Wallet",
    isFirebaseAdmin: "Firebase Admin",
    yes: "Yes",
    no: "No",
    viewContract: "View Contract",
    refreshStatus: "Refresh Status",
    loading: "Loading...",
    error: "Error loading admin status",
    userAnalytics: "User Analytics"
  },
  es: {
    title: "Panel de Administración",
    description: "Controles de administrador basados en contratos inteligentes y gestión de plataforma.",
    adminSystem: "Sistema de Admin de Contratos Inteligentes",
    smartContractAdmin: "Validación de Admin de Producción",
    contractInfo: "Información del Contrato",
    adminStatus: "Estado de Admin",
    userManagement: "Gestión de Usuarios",
    claimableNfts: "NFTs Reclamables",
    adminManagement: "Gestión de Administradores",
    manageAdmins: "Gestionar Administradores",
    accessDenied: "Acceso Denegado",
    accessDeniedDesc: "Necesita privilegios de administrador para acceder a esta página. El estado de admin se verifica en cadena.",
    adminWallet: "Billetera Admin",
    factoryOwner: "Propietario de Factory",
    subscriptionOwner: "Propietario de Subscription",
    network: "Red",
    contractAddresses: "Direcciones de Contrato",
    isAdmin: "Es Admin",
    isFactoryOwner: "Es Propietario de Factory",
    isSubscriptionOwner: "Es Propietario de Subscription",
    isAdminWallet: "Es Billetera Admin",
    isFirebaseAdmin: "Admin Firebase",
    yes: "Sí",
    no: "No",
    viewContract: "Ver Contrato",
    refreshStatus: "Actualizar Estado",
    loading: "Cargando...",
    error: "Error al cargar estado de admin",
    userAnalytics: "Analíticas de Usuario"
  },
  pt: {
    title: "Painel de Administração",
    description: "Controles de administrador baseados em contratos inteligentes e gestão de plataforma.",
    adminSystem: "Sistema Admin de Contratos Inteligentes",
    smartContractAdmin: "Validação Admin de Produção",
    contractInfo: "Informações do Contrato",
    adminStatus: "Status Admin",
    userManagement: "Gestão de Usuários",
    claimableNfts: "NFTs Reivindicáveis",
    adminManagement: "Gerenciamento de Administradores",
    manageAdmins: "Gerenciar Administradores",
    accessDenied: "Acesso Negado",
    accessDeniedDesc: "Você precisa de privilégios de administrador para acessar esta página. O status admin é verificado na blockchain.",
    adminWallet: "Carteira Admin",
    factoryOwner: "Proprietário da Factory",
    subscriptionOwner: "Proprietário da Subscription",
    network: "Rede",
    contractAddresses: "Endereços de Contrato",
    isAdmin: "É Admin",
    isFactoryOwner: "É Proprietário da Factory",
    isSubscriptionOwner: "É Proprietário da Subscription",
    isAdminWallet: "É Carteira Admin",
    isFirebaseAdmin: "Admin Firebase",
    yes: "Sim",
    no: "Não",
    viewContract: "Ver Contrato",
    refreshStatus: "Atualizar Status",
    loading: "Carregando...",
    error: "Erro ao carregar status admin",
    userAnalytics: "Análise de Usuários"
  },
  fr: {
    title: "Panneau d'Administration",
    description: "Contrôles d'administrateur basés sur des contrats intelligents et gestion de plateforme.",
    adminSystem: "Système Admin de Contrats Intelligents",
    smartContractAdmin: "Validation Admin de Production",
    contractInfo: "Informations du Contrat",
    adminStatus: "Statut Admin",
    userManagement: "Gestion des Utilisateurs",
    claimableNfts: "NFTs Réclamables",
    adminManagement: "Gestion des Administrateurs",
    manageAdmins: "Gérer les Administrateurs",
    accessDenied: "Accès Refusé",
    accessDeniedDesc: "Vous avez besoin de privilèges d'administrateur pour accéder à cette page. Le statut admin est vérifié sur la blockchain.",
    adminWallet: "Portefeuille Admin",
    factoryOwner: "Propriétaire Factory",
    subscriptionOwner: "Propriétaire Subscription",
    network: "Réseau",
    contractAddresses: "Adresses de Contrat",
    isAdmin: "Est Admin",
    isFactoryOwner: "Est Propriétaire Factory",
    isSubscriptionOwner: "Est Propriétaire Subscription",
    isAdminWallet: "Est Portefeuille Admin",
    isFirebaseAdmin: "Admin Firebase",
    yes: "Oui",
    no: "Non",
    viewContract: "Voir Contrat",
    refreshStatus: "Actualiser Statut",
    loading: "Chargement...",
    error: "Erreur lors du chargement du statut admin",
    userAnalytics: "Analyse des Utilisateurs"
  }
}

export default function SmartContractAdminPage() {
  const params = useParams()
  const locale = (params?.locale as string) || defaultLocale
  const t = translations[locale] || translations.en
  const router = useRouter()
  
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const smartContractAdminService = useSmartContractAdminService()
  const firebaseAdminService = useAdminService()
  
  // State management
  const [adminPermissions, setAdminPermissions] = useState<AdminPermissions | null>(null)
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Load admin status and contract information
  const loadAdminData = async () => {
    if (!address) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setHasError(false)

    try {
      // Check both smart contract and Firebase admin status
      const [permissions, info, firebaseAdminStatus] = await Promise.all([
        smartContractAdminService.verifyAdminPermissions(address),
        smartContractAdminService.getAdminInfo(),
        firebaseAdminService.isAdmin(address)
      ])
      
      setAdminPermissions(permissions)
      setAdminInfo(info)
      setIsFirebaseAdmin(firebaseAdminStatus)
    } catch (error) {
      console.error('Error loading admin data:', error)
      setHasError(true)
      
      // Try fallback for Firebase admin check
      try {
        const firebaseAdminStatus = firebaseAdminService.isAdminSync(address)
        setIsFirebaseAdmin(firebaseAdminStatus)
      } catch (fbError) {
        console.error('Fallback Firebase admin check failed:', fbError)
      }
      
      toast({
        title: t.error,
        description: "Failed to load admin status from smart contracts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Redirect to home if not connected
  useEffect(() => {
    const checkConnection = setTimeout(() => {
      if (!isConnected) {
        router.push('/')
      }
    }, 1000)

    return () => clearTimeout(checkConnection)
  }, [isConnected, router])

  // Load admin data on mount and when address changes
  useEffect(() => {
    loadAdminData()
  }, [address])

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

  // Get explorer URL for contract
  const getExplorerUrl = (address: string) => {
    const isTestnet = adminInfo?.network.toLowerCase().includes('sepolia')
    const baseUrl = isTestnet 
      ? 'https://sepolia.basescan.org/address/' 
      : 'https://basescan.org/address/'
    return baseUrl + address
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-lg">{t.loading}</div>
          </div>
        </main>
      </div>
    )
  }

  // Access control - show error if not admin (either smart contract or Firebase)
  if (!adminPermissions?.isAdmin && !isFirebaseAdmin && !hasError) {
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
            <Button onClick={loadAdminData} variant="outline">
              {t.refreshStatus}
            </Button>
          </div>

          {/* Smart Contract Admin System */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t.smartContractAdmin}
              </CardTitle>
              <CardDescription>
                Admin status is validated directly from smart contracts on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Admin Status */}
                <div>
                  <h4 className="font-semibold mb-3">{t.adminStatus}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t.isAdmin}</span>
                      <Badge variant={adminPermissions?.isAdmin ? "default" : "secondary"}>
                        {adminPermissions?.isAdmin ? t.yes : t.no}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t.isAdminWallet}</span>
                      <Badge variant={adminPermissions?.isAdminWallet ? "default" : "secondary"}>
                        {adminPermissions?.isAdminWallet ? t.yes : t.no}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t.isFirebaseAdmin}</span>
                      <Badge variant={isFirebaseAdmin ? "default" : "secondary"}>
                        {isFirebaseAdmin ? t.yes : t.no}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t.isFactoryOwner}</span>
                      <Badge variant={adminPermissions?.isFactoryOwner ? "default" : "secondary"}>
                        {adminPermissions?.isFactoryOwner ? t.yes : t.no}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t.isSubscriptionOwner}</span>
                      <Badge variant={adminPermissions?.isSubscriptionOwner ? "default" : "secondary"}>
                        {adminPermissions?.isSubscriptionOwner ? t.yes : t.no}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contract Information */}
                <div>
                  <h4 className="font-semibold mb-3">{t.contractInfo}</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">{t.network}: </span>
                      <span className="text-sm">{adminInfo?.network}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">{t.adminWallet}: </span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {adminInfo?.adminWallet.slice(0, 6)}...{adminInfo?.adminWallet.slice(-4)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => adminInfo && handleCopyAddress(adminInfo.adminWallet)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => adminInfo && window.open(getExplorerUrl(adminInfo.adminWallet), '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">{t.factoryOwner}: </span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {adminInfo?.factoryOwner.slice(0, 6)}...{adminInfo?.factoryOwner.slice(-4)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => adminInfo && handleCopyAddress(adminInfo.factoryOwner)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => adminInfo && window.open(getExplorerUrl(adminInfo.factoryOwner), '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">{t.subscriptionOwner}: </span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {adminInfo?.subscriptionOwner.slice(0, 6)}...{adminInfo?.subscriptionOwner.slice(-4)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => adminInfo && handleCopyAddress(adminInfo.subscriptionOwner)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => adminInfo && window.open(getExplorerUrl(adminInfo.subscriptionOwner), '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Addresses */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-3">{t.contractAddresses}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Factory V6: </span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {adminPermissions?.contractAddresses.factoryV6.slice(0, 6)}...{adminPermissions?.contractAddresses.factoryV6.slice(-4)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adminPermissions && handleCopyAddress(adminPermissions.contractAddresses.factoryV6)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adminPermissions && window.open(getExplorerUrl(adminPermissions.contractAddresses.factoryV6), '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Subscription V6: </span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {adminPermissions?.contractAddresses.subscriptionV6.slice(0, 6)}...{adminPermissions?.contractAddresses.subscriptionV6.slice(-4)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adminPermissions && handleCopyAddress(adminPermissions.contractAddresses.subscriptionV6)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => adminPermissions && window.open(getExplorerUrl(adminPermissions.contractAddresses.subscriptionV6), '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Users Management */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t.userManagement}
                  </CardTitle>
                  <CardDescription>
                    View and manage all users of the platform. Access user details, profile status, and more.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UsersList pageSize={10} />
            </CardContent>
          </Card>

          {/* Admin Management */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t.adminManagement}
                  </CardTitle>
                  <CardDescription>
                    Add and manage additional administrator wallet addresses with Firebase-based controls.
                  </CardDescription>
                </div>
                <Button asChild className="w-full md:w-auto mt-2 md:mt-0 bg-pink-500 hover:bg-pink-600">
                  <a href={`/${locale}/admin/manage-admins`}>{t.manageAdmins}</a>
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Claimable NFTs Management */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-gem"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M8 10h8" /><path d="M8 14h8" /></svg>
                    {t.claimableNfts}
                  </CardTitle>
                  <CardDescription>
                    Create and manage NFTs that can be claimed with special codes.
                  </CardDescription>
                </div>
                <Button asChild className="w-full md:w-auto mt-2 md:mt-0">
                  <a href="/admin/nfts">Manage NFTs</a>
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Information Note */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              <div className="font-semibold">Smart Contract Admin System</div>
              <div className="mt-1">
                This admin panel uses on-chain verification for administrator privileges. 
                Admin status is validated directly from the smart contracts, ensuring security and transparency.
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </main>
      <br />
      <br />
      <br />
    </div>
  )
}