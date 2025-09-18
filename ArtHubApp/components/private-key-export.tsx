"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, Download, Eye, EyeOff, AlertTriangle, Shield, Key, CheckCheck } from "lucide-react"
import { useSafePrivy, useSafeWallets } from "@/hooks/useSafePrivy"

interface PrivateKeyExportProps {
  translations: {
    exportPrivateKey: string
    privateKeyExport: string
    securityWarning: string
    warningMessage: string
    confirmUnderstanding: string
    exportKey: string
    privateKey: string
    copyKey: string
    downloadKey: string
    keyCopied: string
    keyDownloaded: string
    cancel: string
    loading: string
    errorExporting: string
    onlyForSocialLogin: string
    embeddedWalletRequired: string
    showKey: string
    hideKey: string
    exportInstructions: string
    securityTips: string
    tip1: string
    tip2: string
    tip3: string
    tip4: string
    confirmations: string
    confirm1: string
    confirm2: string
    confirm3: string
    walletType: string
    embeddedWallet: string
    externalWallet: string
  }
}

// Translation content
const translations = {
  en: {
    exportPrivateKey: "Export Private Key",
    privateKeyExport: "Private Key Export",
    securityWarning: "Security Warning",
    warningMessage: "Exporting your private key is a sensitive operation. Anyone with access to your private key can control your wallet and all its assets. Only proceed if you understand the risks.",
    confirmUnderstanding: "I understand the security risks",
    exportKey: "Export Key",
    privateKey: "Private Key",
    copyKey: "Copy Key",
    downloadKey: "Download Key",
    keyCopied: "Key Copied!",
    keyDownloaded: "Key Downloaded!",
    cancel: "Cancel",
    loading: "Loading...",
    errorExporting: "Error exporting private key",
    onlyForSocialLogin: "This feature is only available for embedded wallets created through social login",
    embeddedWalletRequired: "Embedded wallet required",
    showKey: "Show Key",
    hideKey: "Hide Key",
    exportInstructions: "Export Instructions",
    securityTips: "Security Tips",
    tip1: "Never share your private key with anyone",
    tip2: "Store it in a secure location offline",
    tip3: "Consider using a hardware wallet for better security", 
    tip4: "Make sure you're on a secure network",
    confirmations: "Confirmations Required",
    confirm1: "I understand that anyone with my private key can access my wallet",
    confirm2: "I will store this private key securely and never share it",
    confirm3: "I understand ART3-HUB cannot recover this key if I lose it",
    walletType: "Wallet Type",
    embeddedWallet: "Embedded Wallet (Social Login)",
    externalWallet: "External Wallet"
  },
  es: {
    exportPrivateKey: "Exportar Clave Privada",
    privateKeyExport: "Exportación de Clave Privada",
    securityWarning: "Advertencia de Seguridad", 
    warningMessage: "Exportar tu clave privada es una operación sensible. Cualquiera con acceso a tu clave privada puede controlar tu wallet y todos sus activos. Solo procede si entiendes los riesgos.",
    confirmUnderstanding: "Entiendo los riesgos de seguridad",
    exportKey: "Exportar Clave",
    privateKey: "Clave Privada",
    copyKey: "Copiar Clave",
    downloadKey: "Descargar Clave",
    keyCopied: "¡Clave Copiada!",
    keyDownloaded: "¡Clave Descargada!",
    cancel: "Cancelar",
    loading: "Cargando...",
    errorExporting: "Error al exportar clave privada",
    onlyForSocialLogin: "Esta función solo está disponible para wallets integradas creadas mediante login social",
    embeddedWalletRequired: "Se requiere wallet integrada",
    showKey: "Mostrar Clave",
    hideKey: "Ocultar Clave", 
    exportInstructions: "Instrucciones de Exportación",
    securityTips: "Consejos de Seguridad",
    tip1: "Nunca compartas tu clave privada con nadie",
    tip2: "Guárdala en un lugar seguro sin conexión",
    tip3: "Considera usar una wallet de hardware para mayor seguridad",
    tip4: "Asegúrate de estar en una red segura",
    confirmations: "Confirmaciones Requeridas",
    confirm1: "Entiendo que cualquiera con mi clave privada puede acceder a mi wallet",
    confirm2: "Guardaré esta clave privada de forma segura y nunca la compartiré",
    confirm3: "Entiendo que ART3-HUB no puede recuperar esta clave si la pierdo",
    walletType: "Tipo de Wallet",
    embeddedWallet: "Wallet Integrada (Login Social)",
    externalWallet: "Wallet Externa"
  },
  fr: {
    exportPrivateKey: "Exporter la Clé Privée",
    privateKeyExport: "Exportation de Clé Privée",
    securityWarning: "Avertissement de Sécurité",
    warningMessage: "L'exportation de votre clé privée est une opération sensible. Toute personne ayant accès à votre clé privée peut contrôler votre portefeuille et tous ses actifs. Ne procédez que si vous comprenez les risques.",
    confirmUnderstanding: "Je comprends les risques de sécurité",
    exportKey: "Exporter la Clé",
    privateKey: "Clé Privée",
    copyKey: "Copier la Clé",
    downloadKey: "Télécharger la Clé",
    keyCopied: "Clé Copiée!",
    keyDownloaded: "Clé Téléchargée!",
    cancel: "Annuler",
    loading: "Chargement...",
    errorExporting: "Erreur lors de l'exportation de la clé privée",
    onlyForSocialLogin: "Cette fonctionnalité n'est disponible que pour les portefeuilles intégrés créés via connexion sociale",
    embeddedWalletRequired: "Portefeuille intégré requis",
    showKey: "Afficher la Clé",
    hideKey: "Masquer la Clé",
    exportInstructions: "Instructions d'Exportation",
    securityTips: "Conseils de Sécurité",
    tip1: "Ne partagez jamais votre clé privée avec qui que ce soit",
    tip2: "Stockez-la dans un endroit sûr hors ligne",
    tip3: "Considérez l'utilisation d'un portefeuille matériel pour une meilleure sécurité",
    tip4: "Assurez-vous d'être sur un réseau sécurisé",
    confirmations: "Confirmations Requises",
    confirm1: "Je comprends que quiconque avec ma clé privée peut accéder à mon portefeuille",
    confirm2: "Je stockerai cette clé privée en sécurité et ne la partagerai jamais",
    confirm3: "Je comprends qu'ART3-HUB ne peut pas récupérer cette clé si je la perds",
    walletType: "Type de Portefeuille",
    embeddedWallet: "Portefeuille Intégré (Connexion Sociale)",
    externalWallet: "Portefeuille Externe"
  },
  pt: {
    exportPrivateKey: "Exportar Chave Privada",
    privateKeyExport: "Exportação de Chave Privada", 
    securityWarning: "Aviso de Segurança",
    warningMessage: "Exportar sua chave privada é uma operação sensível. Qualquer pessoa com acesso à sua chave privada pode controlar sua carteira e todos os seus ativos. Prossiga apenas se você entender os riscos.",
    confirmUnderstanding: "Eu entendo os riscos de segurança",
    exportKey: "Exportar Chave",
    privateKey: "Chave Privada",
    copyKey: "Copiar Chave",
    downloadKey: "Baixar Chave",
    keyCopied: "Chave Copiada!",
    keyDownloaded: "Chave Baixada!",
    cancel: "Cancelar",
    loading: "Carregando...",
    errorExporting: "Erro ao exportar chave privada",
    onlyForSocialLogin: "Este recurso está disponível apenas para carteiras incorporadas criadas através de login social",
    embeddedWalletRequired: "Carteira incorporada necessária",
    showKey: "Mostrar Chave",
    hideKey: "Ocultar Chave",
    exportInstructions: "Instruções de Exportação", 
    securityTips: "Dicas de Segurança",
    tip1: "Nunca compartilhe sua chave privada com ninguém",
    tip2: "Armazene-a em um local seguro offline",
    tip3: "Considere usar uma carteira de hardware para melhor segurança",
    tip4: "Certifique-se de estar em uma rede segura",
    confirmations: "Confirmações Necessárias",
    confirm1: "Eu entendo que qualquer um com minha chave privada pode acessar minha carteira",
    confirm2: "Vou armazenar esta chave privada com segurança e nunca a compartilharei",
    confirm3: "Eu entendo que a ART3-HUB não pode recuperar esta chave se eu a perder",
    walletType: "Tipo de Carteira",
    embeddedWallet: "Carteira Incorporada (Login Social)",
    externalWallet: "Carteira Externa"
  }
}

export function PrivateKeyExport({ translations: t }: PrivateKeyExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [privateKey, setPrivateKey] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string>("")
  const [showKey, setShowKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [downloadedKey, setDownloadedKey] = useState(false)
  
  // Confirmation states
  const [confirmSecurity, setConfirmSecurity] = useState(false)
  const [confirmStorage, setConfirmStorage] = useState(false)
  const [confirmRecovery, setConfirmRecovery] = useState(false)

  const { authenticated, user, exportWallet } = useSafePrivy()
  const { wallets } = useSafeWallets()

  // Extract the actual wallets array from the hook result
  // useSafeWallets returns { wallets: [...], ready: true }
  const walletsArray = Array.isArray(wallets?.wallets) ? wallets.wallets : (Array.isArray(wallets) ? wallets : [])

  // Check if user has an embedded wallet from social login
  // Primary indicators for Privy embedded wallets
  const isEmbeddedWallet = (wallet: any) => {
    if (!wallet) return false
    
    // Primary check: Privy embedded wallets have specific client/connector types
    const hasPrivyIdentifiers = wallet.walletClientType === 'privy' || 
                               wallet.connectorType === 'embedded'
    
    // Secondary check: Not imported (created by Privy)
    const isNotImported = wallet.imported === false
    
    // Tertiary check: User has social login and wallet matches user's wallet
    const hasSocialLogin = user?.linkedAccounts?.some((account: any) => 
      account.type === 'google_oauth' || account.type === 'twitter_oauth' || account.type === 'email'
    )
    const isUserWallet = user?.wallet?.address === wallet.address
    
    return hasPrivyIdentifiers || isNotImported || (hasSocialLogin && isUserWallet)
  }

  // Modified logic: Allow embedded wallet detection even if auth state isn't fully restored
  // This handles cases where wallet exists but Privy session needs to be restored
  const hasEmbeddedWallet = walletsArray.length > 0 && walletsArray.some(isEmbeddedWallet)

  // Get the embedded wallet
  const embeddedWallet = walletsArray.find(isEmbeddedWallet)
  
  // Allow export if we have an embedded wallet, even if auth state isn't fully restored
  const isExportAllowed = hasEmbeddedWallet && embeddedWallet

  // Debug logging for development (after all variables are defined)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 PrivateKeyExport Debug:', {
      authenticated,
      hasUser: !!user,
      userId: user?.id,
      userWallet: user?.wallet,
      userLinkedAccounts: user?.linkedAccounts,
      walletsType: typeof wallets,
      walletsValue: wallets,
      walletsArrayLength: walletsArray.length,
      rawWalletsArray: wallets?.wallets,
      hasEmbeddedWallet,
      embeddedWallet,
      isExportAllowed,
      walletTypes: walletsArray.map(w => ({
        clientType: w?.walletClientType,
        connectorType: w?.connectorType,
        walletType: w?.walletType,
        imported: w?.imported,
        address: w?.address,
        id: w?.id
      })),
      hasEmbeddedWallet,
      embeddedWallet: embeddedWallet ? {
        clientType: embeddedWallet.walletClientType,
        connectorType: embeddedWallet.connectorType,
        address: embeddedWallet.address
      } : null,
      isExportAllowed
    })
  }

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setPrivateKey("")
      setError("")
      setShowKey(false)
      setCopiedKey(false)
      setDownloadedKey(false)
      setConfirmSecurity(false)
      setConfirmStorage(false)
      setConfirmRecovery(false)
    }
  }

  // Export private key function
  const handleExportPrivateKey = async () => {
    if (!embeddedWallet) {
      setError(t.embeddedWalletRequired)
      return
    }

    setIsExporting(true)
    setError("")

    try {
      // Use Privy's exportWallet method for embedded wallets
      // This returns the private key for the embedded wallet
      if (!exportWallet) {
        throw new Error('Export wallet function not available')
      }
      
      const key = await exportWallet()
      setPrivateKey(key)
    } catch (err: any) {
      console.error('Error exporting private key:', err)
      setError(err.message || t.errorExporting)
    } finally {
      setIsExporting(false)
    }
  }

  // Copy private key to clipboard
  const copyPrivateKey = async () => {
    if (!privateKey) return
    
    try {
      await navigator.clipboard.writeText(privateKey)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 3000)
    } catch (err) {
      console.error('Failed to copy private key:', err)
    }
  }

  // Download private key as text file
  const downloadPrivateKey = () => {
    if (!privateKey) return
    
    const blob = new Blob([privateKey], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `art3hub-private-key-${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    setDownloadedKey(true)
    setTimeout(() => setDownloadedKey(false), 3000)
  }

  // Check if all confirmations are checked
  const allConfirmsChecked = confirmSecurity && confirmStorage && confirmRecovery

  if (!isExportAllowed) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t.exportPrivateKey}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <div>
              <p className="font-medium">{t.walletType}:</p>
              <p>{hasEmbeddedWallet ? t.embeddedWallet : t.externalWallet}</p>
            </div>
          </div>
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t.onlyForSocialLogin}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          {t.exportPrivateKey}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
          <Shield className="h-4 w-4" />
          <div>
            <p className="font-medium">{t.walletType}:</p>
            <p>{t.embeddedWallet}</p>
          </div>
        </div>
        
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <Key className="h-4 w-4 mr-2" />
              {t.exportPrivateKey}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                {t.privateKeyExport}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Security Warning */}
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertTitle className="text-red-700">{t.securityWarning}</AlertTitle>
                <AlertDescription className="text-red-600">
                  {t.warningMessage}
                </AlertDescription>
              </Alert>
              
              {/* Security Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t.securityTips}
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• {t.tip1}</li>
                  <li>• {t.tip2}</li>
                  <li>• {t.tip3}</li>
                  <li>• {t.tip4}</li>
                </ul>
              </div>
              
              {/* Confirmations */}
              <div className="space-y-4">
                <h4 className="font-semibold">{t.confirmations}</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="confirm1"
                      checked={confirmSecurity}
                      onCheckedChange={setConfirmSecurity}
                    />
                    <Label htmlFor="confirm1" className="text-sm leading-5">
                      {t.confirm1}
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="confirm2"
                      checked={confirmStorage}
                      onCheckedChange={setConfirmStorage}
                    />
                    <Label htmlFor="confirm2" className="text-sm leading-5">
                      {t.confirm2}
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="confirm3"
                      checked={confirmRecovery}
                      onCheckedChange={setConfirmRecovery}
                    />
                    <Label htmlFor="confirm3" className="text-sm leading-5">
                      {t.confirm3}
                    </Label>
                  </div>
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-600">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Private Key Display */}
              {privateKey && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-semibold">{t.privateKey}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            {t.hideKey}
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            {t.showKey}
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <Textarea
                      value={showKey ? privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                      readOnly
                      className="font-mono text-xs bg-gray-50 border-2 border-gray-200 min-h-[100px] resize-none"
                      style={{ wordBreak: 'break-all' }}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      onClick={copyPrivateKey}
                      variant="outline"
                      className="flex-1"
                      disabled={!showKey}
                    >
                      {copiedKey ? (
                        <>
                          <CheckCheck className="h-4 w-4 mr-2 text-green-600" />
                          {t.keyCopied}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          {t.copyKey}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={downloadPrivateKey}
                      variant="outline"
                      className="flex-1"
                    >
                      {downloadedKey ? (
                        <>
                          <CheckCheck className="h-4 w-4 mr-2 text-green-600" />
                          {t.keyDownloaded}
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          {t.downloadKey}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t.cancel}
              </Button>
              
              {!privateKey && (
                <Button
                  onClick={handleExportPrivateKey}
                  disabled={!allConfirmsChecked || isExporting}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {t.loading}
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      {t.exportKey}
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// Get translations for current locale
export function getPrivateKeyExportTranslations(locale: string) {
  return translations[locale as keyof typeof translations] || translations.en
}