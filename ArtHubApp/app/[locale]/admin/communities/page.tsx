"use client"

// Prevent static generation for pages using Web3 hooks
export const dynamic = 'force-dynamic'

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, Edit, Trash2, ExternalLink, Users, AlertCircle, CheckCircle, Eye, EyeOff, Star, StarOff } from "lucide-react"
import { useAccount } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { type Community } from "@/lib/firebase"

interface CommunitiesTranslations {
  title: string
  description: string
  backToAdmin: string
  createCommunity: string
  editCommunity: string
  deleteCommunity: string
  confirmDelete: string
  confirmDeleteDesc: string
  cancel: string
  delete: string
  save: string
  create: string
  communityTitle: string
  communityDescription: string
  links: string
  status: string
  featured: string
  draft: string
  published: string
  archived: string
  yes: string
  no: string
  searchPlaceholder: string
  noCommunitiesFound: string
  loadingCommunities: string
  errorLoading: string
  createdBy: string
  createdAt: string
  updatedAt: string
  actions: string
  totalCommunities: string
  publishedCommunities: string
  draftCommunities: string
  archivedCommunities: string
  featuredCommunities: string
  manageCommunities: string
  addLink: string
  removeLink: string
  linkPlaceholder: string
  requiredField: string
  successCreate: string
  successUpdate: string
  successDelete: string
  errorCreate: string
  errorUpdate: string
  errorDelete: string
}

const translations: Record<string, CommunitiesTranslations> = {
  en: {
    title: "Communities Management",
    description: "Create and manage art communities that support and connect artists worldwide.",
    backToAdmin: "Back to Admin",
    createCommunity: "Create Community",
    editCommunity: "Edit Community",
    deleteCommunity: "Delete Community",
    confirmDelete: "Confirm Deletion",
    confirmDeleteDesc: "Are you sure you want to delete this community? This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save Changes",
    create: "Create Community",
    communityTitle: "Community Title",
    communityDescription: "Community Description",
    links: "Links",
    status: "Status",
    featured: "Featured",
    draft: "Draft",
    published: "Published",
    archived: "Archived",
    yes: "Yes",
    no: "No",
    searchPlaceholder: "Search communities...",
    noCommunitiesFound: "No communities found",
    loadingCommunities: "Loading communities...",
    errorLoading: "Error loading communities",
    createdBy: "Created by",
    createdAt: "Created",
    updatedAt: "Updated",
    actions: "Actions",
    totalCommunities: "Total Communities",
    publishedCommunities: "Published",
    draftCommunities: "Drafts",
    archivedCommunities: "Archived",
    featuredCommunities: "Featured",
    manageCommunities: "Manage Communities",
    addLink: "Add Link",
    removeLink: "Remove",
    linkPlaceholder: "https://...",
    requiredField: "This field is required",
    successCreate: "Community created successfully",
    successUpdate: "Community updated successfully",
    successDelete: "Community deleted successfully",
    errorCreate: "Failed to create community",
    errorUpdate: "Failed to update community",
    errorDelete: "Failed to delete community"
  },
  es: {
    title: "Gestión de Comunidades",
    description: "Crear y gestionar comunidades artísticas que apoyan y conectan artistas mundialmente.",
    backToAdmin: "Volver al Admin",
    createCommunity: "Crear Comunidad",
    editCommunity: "Editar Comunidad",
    deleteCommunity: "Eliminar Comunidad",
    confirmDelete: "Confirmar Eliminación",
    confirmDeleteDesc: "¿Estás seguro de que quieres eliminar esta comunidad? Esta acción no se puede deshacer.",
    cancel: "Cancelar",
    delete: "Eliminar",
    save: "Guardar Cambios",
    create: "Crear Comunidad",
    communityTitle: "Título de la Comunidad",
    communityDescription: "Descripción de la Comunidad",
    links: "Enlaces",
    status: "Estado",
    featured: "Destacada",
    draft: "Borrador",
    published: "Publicada",
    archived: "Archivada",
    yes: "Sí",
    no: "No",
    searchPlaceholder: "Buscar comunidades...",
    noCommunitiesFound: "No se encontraron comunidades",
    loadingCommunities: "Cargando comunidades...",
    errorLoading: "Error al cargar comunidades",
    createdBy: "Creada por",
    createdAt: "Creada",
    updatedAt: "Actualizada",
    actions: "Acciones",
    totalCommunities: "Total de Comunidades",
    publishedCommunities: "Publicadas",
    draftCommunities: "Borradores",
    archivedCommunities: "Archivadas",
    featuredCommunities: "Destacadas",
    manageCommunities: "Gestionar Comunidades",
    addLink: "Agregar Enlace",
    removeLink: "Remover",
    linkPlaceholder: "https://...",
    requiredField: "Este campo es requerido",
    successCreate: "Comunidad creada exitosamente",
    successUpdate: "Comunidad actualizada exitosamente",
    successDelete: "Comunidad eliminada exitosamente",
    errorCreate: "Error al crear comunidad",
    errorUpdate: "Error al actualizar comunidad",
    errorDelete: "Error al eliminar comunidad"
  },
  pt: {
    title: "Gerenciamento de Comunidades",
    description: "Criar e gerenciar comunidades artísticas que apoiam e conectam artistas mundialmente.",
    backToAdmin: "Voltar ao Admin",
    createCommunity: "Criar Comunidade",
    editCommunity: "Editar Comunidade",
    deleteCommunity: "Excluir Comunidade",
    confirmDelete: "Confirmar Exclusão",
    confirmDeleteDesc: "Tem certeza de que deseja excluir esta comunidade? Esta ação não pode ser desfeita.",
    cancel: "Cancelar",
    delete: "Excluir",
    save: "Salvar Alterações",
    create: "Criar Comunidade",
    communityTitle: "Título da Comunidade",
    communityDescription: "Descrição da Comunidade",
    links: "Links",
    status: "Status",
    featured: "Destaque",
    draft: "Rascunho",
    published: "Publicada",
    archived: "Arquivada",
    yes: "Sim",
    no: "Não",
    searchPlaceholder: "Buscar comunidades...",
    noCommunitiesFound: "Nenhuma comunidade encontrada",
    loadingCommunities: "Carregando comunidades...",
    errorLoading: "Erro ao carregar comunidades",
    createdBy: "Criada por",
    createdAt: "Criada",
    updatedAt: "Atualizada",
    actions: "Ações",
    totalCommunities: "Total de Comunidades",
    publishedCommunities: "Publicadas",
    draftCommunities: "Rascunhos",
    archivedCommunities: "Arquivadas",
    featuredCommunities: "Destaques",
    manageCommunities: "Gerenciar Comunidades",
    addLink: "Adicionar Link",
    removeLink: "Remover",
    linkPlaceholder: "https://...",
    requiredField: "Este campo é obrigatório",
    successCreate: "Comunidade criada com sucesso",
    successUpdate: "Comunidade atualizada com sucesso",
    successDelete: "Comunidade excluída com sucesso",
    errorCreate: "Falha ao criar comunidade",
    errorUpdate: "Falha ao atualizar comunidade",
    errorDelete: "Falha ao excluir comunidade"
  },
  fr: {
    title: "Gestion des Communautés",
    description: "Créer et gérer des communautés artistiques qui soutiennent et connectent les artistes mondialement.",
    backToAdmin: "Retour à Admin",
    createCommunity: "Créer Communauté",
    editCommunity: "Modifier Communauté",
    deleteCommunity: "Supprimer Communauté",
    confirmDelete: "Confirmer Suppression",
    confirmDeleteDesc: "Êtes-vous sûr de vouloir supprimer cette communauté ? Cette action ne peut pas être annulée.",
    cancel: "Annuler",
    delete: "Supprimer",
    save: "Sauvegarder",
    create: "Créer Communauté",
    communityTitle: "Titre de la Communauté",
    communityDescription: "Description de la Communauté",
    links: "Liens",
    status: "Statut",
    featured: "En Vedette",
    draft: "Brouillon",
    published: "Publiée",
    archived: "Archivée",
    yes: "Oui",
    no: "Non",
    searchPlaceholder: "Rechercher communautés...",
    noCommunitiesFound: "Aucune communauté trouvée",
    loadingCommunities: "Chargement des communautés...",
    errorLoading: "Erreur lors du chargement",
    createdBy: "Créée par",
    createdAt: "Créée",
    updatedAt: "Mise à jour",
    actions: "Actions",
    totalCommunities: "Total Communautés",
    publishedCommunities: "Publiées",
    draftCommunities: "Brouillons",
    archivedCommunities: "Archivées",
    featuredCommunities: "En Vedette",
    manageCommunities: "Gérer Communautés",
    addLink: "Ajouter Lien",
    removeLink: "Supprimer",
    linkPlaceholder: "https://...",
    requiredField: "Ce champ est requis",
    successCreate: "Communauté créée avec succès",
    successUpdate: "Communauté mise à jour avec succès",
    successDelete: "Communauté supprimée avec succès",
    errorCreate: "Échec de création de communauté",
    errorUpdate: "Échec de mise à jour de communauté",
    errorDelete: "Échec de suppression de communauté"
  }
}

export default function AdminCommunitiesPage() {
  const params = useParams()
  const locale = (params?.locale as string) || defaultLocale
  const t = translations[locale] || translations.en
  
  const { address } = useAccount()
  const { toast } = useToast()
  
  // State management
  const [communities, setCommunities] = useState<Community[]>([])
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [stats, setStats] = useState({
    totalDraft: 0,
    totalPublished: 0,
    totalArchived: 0,
    totalFeatured: 0
  })

  // Form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [communityToDelete, setCommunityToDelete] = useState<Community | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    links: [""],
    status: "draft" as "draft" | "published" | "archived",
    featured: false
  })

  // Load communities and stats
  const loadCommunities = async () => {
    setLoading(true)
    try {
      const [communitiesResponse, statsResponse] = await Promise.all([
        fetch('/api/communities?admin=true'),
        fetch('/api/communities/stats')
      ])

      if (communitiesResponse.ok) {
        const communitiesResult = await communitiesResponse.json()
        if (communitiesResult.success) {
          setCommunities(communitiesResult.data)
        }
      }

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json()
        if (statsResult.success) {
          setStats(statsResult.data)
        }
      }
    } catch (error) {
      console.error('Error loading communities:', error)
      toast({
        title: t.errorLoading,
        description: "Please try refreshing the page",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load communities on mount
  useEffect(() => {
    loadCommunities()
  }, [])

  // Filter communities based on search and status
  useEffect(() => {
    let filtered = communities

    if (searchTerm) {
      filtered = filtered.filter(community =>
        community.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(community => community.status === statusFilter)
    }

    setFilteredCommunities(filtered)
  }, [communities, searchTerm, statusFilter])

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      links: [""],
      status: "draft",
      featured: false
    })
  }

  // Handle create community
  const handleCreateCommunity = async () => {
    if (!address) return

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: t.requiredField,
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          links: formData.links.filter(link => link.trim()),
          created_by: address
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: t.successCreate,
          description: `Community "${formData.title}" has been created`,
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadCommunities()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error creating community:', error)
      toast({
        title: t.errorCreate,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  // Handle edit community
  const handleEditCommunity = (community: Community) => {
    setEditingCommunity(community)
    setFormData({
      title: community.title,
      description: community.description,
      links: community.links.length > 0 ? community.links : [""],
      status: community.status,
      featured: community.featured
    })
    setIsEditDialogOpen(true)
  }

  // Handle update community
  const handleUpdateCommunity = async () => {
    if (!editingCommunity || !address) return

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: t.requiredField,
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/communities/${editingCommunity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          links: formData.links.filter(link => link.trim())
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: t.successUpdate,
          description: `Community "${formData.title}" has been updated`,
        })
        setIsEditDialogOpen(false)
        setEditingCommunity(null)
        resetForm()
        loadCommunities()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating community:', error)
      toast({
        title: t.errorUpdate,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  // Handle delete community
  const handleDeleteCommunity = async () => {
    if (!communityToDelete) return

    try {
      const response = await fetch(`/api/communities/${communityToDelete.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: t.successDelete,
          description: `Community "${communityToDelete.title}" has been deleted`,
        })
        setIsDeleteDialogOpen(false)
        setCommunityToDelete(null)
        loadCommunities()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error deleting community:', error)
      toast({
        title: t.errorDelete,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  // Add link field
  const addLinkField = () => {
    setFormData({
      ...formData,
      links: [...formData.links, ""]
    })
  }

  // Remove link field
  const removeLinkField = (index: number) => {
    const newLinks = formData.links.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      links: newLinks.length > 0 ? newLinks : [""]
    })
  }

  // Update link field
  const updateLinkField = (index: number, value: string) => {
    const newLinks = [...formData.links]
    newLinks[index] = value
    setFormData({
      ...formData,
      links: newLinks
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{t.published}</Badge>
      case 'draft':
        return <Badge variant="secondary"><EyeOff className="w-3 h-3 mr-1" />{t.draft}</Badge>
      case 'archived':
        return <Badge variant="outline"><Eye className="w-3 h-3 mr-1" />{t.archived}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/${locale}/admin`}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t.backToAdmin}
                  </a>
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t.title}
              </h1>
              <p className="text-lg text-gray-600">
                {t.description}
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="w-full md:w-auto bg-[#8B5CF6] hover:bg-[#7C3AED]">
                  <Plus className="w-4 h-4 mr-2" />
                  {t.createCommunity}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t.createCommunity}</DialogTitle>
                  <DialogDescription>
                    Create a new art community to showcase organizations that support artists.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">{t.communityTitle} *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Community name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">{t.communityDescription} *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe the community, its mission, and how it supports artists"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>{t.links}</Label>
                    {formData.links.map((link, index) => (
                      <div key={index} className="flex gap-2 mt-2">
                        <Input
                          value={link}
                          onChange={(e) => updateLinkField(index, e.target.value)}
                          placeholder={t.linkPlaceholder}
                        />
                        {formData.links.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLinkField(index)}
                          >
                            {t.removeLink}
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLinkField}
                      className="mt-2"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {t.addLink}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
                    />
                    <Label htmlFor="featured">{t.featured}</Label>
                  </div>
                  <div>
                    <Label>{t.status}</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t.draft}</SelectItem>
                        <SelectItem value="published">{t.published}</SelectItem>
                        <SelectItem value="archived">{t.archived}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button onClick={handleCreateCommunity} className="bg-[#8B5CF6] hover:bg-[#7C3AED]">
                    {t.create}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t.totalCommunities}</p>
                    <p className="text-2xl font-bold">{stats.totalDraft + stats.totalPublished + stats.totalArchived}</p>
                  </div>
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t.publishedCommunities}</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalPublished}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t.draftCommunities}</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.totalDraft}</p>
                  </div>
                  <EyeOff className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t.archivedCommunities}</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.totalArchived}</p>
                  </div>
                  <Eye className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t.featuredCommunities}</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.totalFeatured}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">{t.published}</SelectItem>
                      <SelectItem value="draft">{t.draft}</SelectItem>
                      <SelectItem value="archived">{t.archived}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Communities List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t.manageCommunities} ({filteredCommunities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t.loadingCommunities}</p>
                </div>
              ) : filteredCommunities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t.noCommunitiesFound}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCommunities.map((community) => (
                    <div key={community.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{community.title}</h3>
                                {community.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                              </div>
                              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{community.description}</p>
                              {community.links.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {community.links.map((link, linkIndex) => (
                                    <a
                                      key={linkIndex}
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      {link.replace(/^https?:\/\//, '').split('/')[0]}
                                    </a>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{t.createdBy}: {community.created_by.slice(0, 6)}...{community.created_by.slice(-4)}</span>
                                <span>{t.createdAt}: {formatDate(community.created_at)}</span>
                                <span>{t.updatedAt}: {formatDate(community.updated_at)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(community.status)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCommunity(community)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCommunityToDelete(community)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.editCommunity}</DialogTitle>
            <DialogDescription>
              Edit the community information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">{t.communityTitle} *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Community name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">{t.communityDescription} *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the community, its mission, and how it supports artists"
                rows={4}
              />
            </div>
            <div>
              <Label>{t.links}</Label>
              {formData.links.map((link, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    value={link}
                    onChange={(e) => updateLinkField(index, e.target.value)}
                    placeholder={t.linkPlaceholder}
                  />
                  {formData.links.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLinkField(index)}
                    >
                      {t.removeLink}
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLinkField}
                className="mt-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                {t.addLink}
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
              />
              <Label htmlFor="edit-featured">{t.featured}</Label>
            </div>
            <div>
              <Label>{t.status}</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t.draft}</SelectItem>
                  <SelectItem value="published">{t.published}</SelectItem>
                  <SelectItem value="archived">{t.archived}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleUpdateCommunity} className="bg-[#8B5CF6] hover:bg-[#7C3AED]">
              {t.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {t.confirmDelete}
            </DialogTitle>
            <DialogDescription>
              {t.confirmDeleteDesc}
              {communityToDelete && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <strong>{communityToDelete.title}</strong>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDeleteCommunity}>
              {t.delete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}