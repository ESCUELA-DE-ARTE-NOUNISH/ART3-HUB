"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus } from "lucide-react"
import { useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"

// Translation content
const translations = {
  en: {
    title: "Create NFT",
    image: "Image",
    clickToUpload: "Click to upload",
    dragAndDrop: "or drag and drop",
    imageFormats: "PNG, JPG or GIF (MAX. 10MB)",
    nftTitle: "Title",
    titlePlaceholder: "Give your NFT a name",
    description: "Description",
    descriptionPlaceholder: "Tell the story behind your creation",
    mint: "Mint NFT",
    minting: "Minting...",
    success: "NFT minted successfully!",
    change: "Change"
  },
  es: {
    title: "Crear NFT",
    image: "Imagen",
    clickToUpload: "Haz clic para subir",
    dragAndDrop: "o arrastra y suelta",
    imageFormats: "PNG, JPG o GIF (MÁX. 10MB)",
    nftTitle: "Título",
    titlePlaceholder: "Dale un nombre a tu NFT",
    description: "Descripción",
    descriptionPlaceholder: "Cuenta la historia detrás de tu creación",
    mint: "Acuñar NFT",
    minting: "Acuñando...",
    success: "¡NFT acuñado con éxito!",
    change: "Cambiar"
  },
  fr: {
    title: "Créer un NFT",
    image: "Image",
    clickToUpload: "Cliquez pour télécharger",
    dragAndDrop: "ou glisser-déposer",
    imageFormats: "PNG, JPG ou GIF (MAX. 10MB)",
    nftTitle: "Titre",
    titlePlaceholder: "Donnez un nom à votre NFT",
    description: "Description",
    descriptionPlaceholder: "Racontez l'histoire derrière votre création",
    mint: "Frapper le NFT",
    minting: "Frappe en cours...",
    success: "NFT frappé avec succès !",
    change: "Changer"
  },
  pt: {
    title: "Criar NFT",
    image: "Imagem",
    clickToUpload: "Clique para fazer upload",
    dragAndDrop: "ou arraste e solte",
    imageFormats: "PNG, JPG ou GIF (MÁX. 10MB)",
    nftTitle: "Título",
    titlePlaceholder: "Dê um nome ao seu NFT",
    description: "Descrição",
    descriptionPlaceholder: "Conte a história por trás da sua criação",
    mint: "Cunhar NFT",
    minting: "Cunhando...",
    success: "NFT cunhado com sucesso!",
    change: "Alterar"
  }
}

export default function CreateNFT() {
  const params = useParams()
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [t, setT] = useState(translations.en)
  const [image, setImage] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Update locale when params change
  useEffect(() => {
    const currentLocale = (params?.locale as string) || defaultLocale
    setLocale(currentLocale)
    setT(translations[currentLocale as keyof typeof translations] || translations.en)
  }, [params])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate minting process
    setTimeout(() => {
      setIsLoading(false)
      alert(t.success)
      // Reset form
      setImage(null)
      setTitle("")
      setDescription("")
    }, 2000)
  }

  return (
    <div className="pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">{t.title}</h1>
      </div>

      <div className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">{t.image}</label>
            <div className="flex justify-center">
              {image ? (
                <div className="relative w-full max-w-xs">
                  <img
                    src={image || "/placeholder.svg"}
                    alt="NFT Preview"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => setImage(null)}
                  >
                    {t.change}
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImagePlus className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">{t.clickToUpload}</span> {t.dragAndDrop}
                    </p>
                    <p className="text-xs text-gray-500">{t.imageFormats}</p>
                  </div>
                  <Input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              {t.nftTitle}
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.titlePlaceholder}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              {t.description}
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={5}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#FF69B4] hover:bg-[#FF1493]"
            disabled={!image || !title || !description || isLoading}
          >
            {isLoading ? t.minting : t.mint}
          </Button>
        </form>
      </div>
    </div>
  )
} 