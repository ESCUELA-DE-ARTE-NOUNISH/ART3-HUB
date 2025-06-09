import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Header from "@/components/header"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  ExternalLink,
  Calendar,
  DollarSign,
  Palette,
  Sparkles,
  Users,
  Globe,
  Lightbulb,
  Award,
} from "lucide-react"

export default function OpportunitiesPage() {
  return (
    <div className="pb-16">
      <Header title="Opportunities" />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3 text-[#FF69B4]">Web3 Opportunities for Artists</h1>
          <p className="text-gray-600">
            Discover how blockchain technology is creating new possibilities for artists to monetize, distribute, and
            protect their creative work.
          </p>
        </div>

        <div className="relative mb-10 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF69B4]/80 to-[#9ACD32]/80 z-10"></div>
          <Image
            src="/opportunities-hero.png"
            alt="Artists in Web3"
            width={1200}
            height={400}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Transform Your Creative Career</h2>
            <p className="mb-4 max-w-lg">
              Web3 is revolutionizing how artists create, sell, and connect with audiences worldwide.
            </p>
            <Link href="#get-started">
              <Button className="bg-white text-[#FF69B4] hover:bg-gray-100 w-fit">
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="nfts" className="mb-10">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="grants">Grants & Funding</TabsTrigger>
            <TabsTrigger value="marketplaces">Marketplaces</TabsTrigger>
          </TabsList>

          <TabsContent value="nfts" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-[#FF69B4]/20 p-3 rounded-full flex-shrink-0">
                    <Palette className="h-6 w-6 text-[#FF69B4]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">NFT Creation & Sales</h3>
                    <p className="text-gray-600 mb-4">
                      Non-Fungible Tokens (NFTs) allow artists to tokenize their work, creating verifiable digital
                      scarcity and ownership. This opens new revenue streams and ways to connect with collectors.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Benefits for Artists</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <DollarSign className="h-4 w-4 text-[#9ACD32] mt-0.5" />
                            <span>Earn royalties on secondary sales (typically 5-10%)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Globe className="h-4 w-4 text-[#9ACD32] mt-0.5" />
                            <span>Access global markets without intermediaries</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-[#9ACD32] mt-0.5" />
                            <span>Build direct relationships with collectors</span>
                          </li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Getting Started</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="bg-[#FF69B4] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                              1
                            </span>
                            <span>Set up a crypto wallet (like MetaMask)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-[#FF69B4] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                              2
                            </span>
                            <span>Choose an NFT marketplace (like Base)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-[#FF69B4] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                              3
                            </span>
                            <span>Create and mint your first NFT</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <Link href="/create">
                      <Button className="w-full bg-[#FF69B4] hover:bg-[#FF1493]">
                        Start Creating NFTs
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communities" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-[#9ACD32]/20 p-3 rounded-full flex-shrink-0">
                    <Users className="h-6 w-6 text-[#9ACD32]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Web3 Artist Communities</h3>
                    <p className="text-gray-600 mb-4">
                      Join thriving communities of artists, collectors, and enthusiasts who are shaping the future of
                      digital art and creative expression on the blockchain.
                    </p>

                    <div className="grid grid-cols-1 gap-4 mb-6">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-[#FF69B4]/10 p-4">
                          <h4 className="font-semibold">Featured Communities</h4>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Image
                                src="/dao-concept.png"
                                alt="DAO"
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            </div>
                            <div>
                              <h5 className="font-medium">Artist DAOs</h5>
                              <p className="text-sm text-gray-500">
                                Decentralized Autonomous Organizations run by and for artists
                              </p>
                            </div>
                            <Button variant="outline" size="sm" className="ml-auto" asChild>
                              <Link href="#" target="_blank">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Explore
                              </Link>
                            </Button>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Image
                                src="/latam-map.png"
                                alt="LATAM"
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            </div>
                            <div>
                              <h5 className="font-medium">LATAM Creators Network</h5>
                              <p className="text-sm text-gray-500">
                                Network specifically for Latin American digital artists
                              </p>
                            </div>
                            <Button variant="outline" size="sm" className="ml-auto" asChild>
                              <Link href="#" target="_blank">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Explore
                              </Link>
                            </Button>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Image
                                src="/discord-logo.png"
                                alt="Discord"
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            </div>
                            <div>
                              <h5 className="font-medium">NFT Discord Communities</h5>
                              <p className="text-sm text-gray-500">
                                Active Discord servers focused on NFT art and creation
                              </p>
                            </div>
                            <Button variant="outline" size="sm" className="ml-auto" asChild>
                              <Link href="#" target="_blank">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Explore
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#9ACD32]/10 p-4 rounded-lg mb-6">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Lightbulb className="h-5 w-5 mr-2 text-[#9ACD32]" />
                        Community Benefits
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Networking with like-minded creators and collectors</li>
                        <li>• Collaborative opportunities and joint projects</li>
                        <li>• Mentorship from established Web3 artists</li>
                        <li>• Early access to new platforms and tools</li>
                        <li>• Shared resources and educational materials</li>
                      </ul>
                    </div>

                    <Link href="/ai-agent?topic=web3-communities">
                      <Button className="w-full bg-[#9ACD32] hover:bg-[#7CFC00]">
                        Learn More About Communities
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grants" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-[#FF69B4]/20 p-3 rounded-full flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-[#FF69B4]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Grants & Funding Opportunities</h3>
                    <p className="text-gray-600 mb-4">
                      Many Web3 platforms, DAOs, and foundations offer grants specifically for artists looking to
                      explore blockchain-based creative work.
                    </p>

                    <div className="space-y-4 mb-6">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-[#FF69B4]/20 to-[#9ACD32]/20 p-4">
                          <h4 className="font-semibold">Upcoming Grant Deadlines</h4>
                        </div>
                        <div className="divide-y">
                          <div className="p-4 flex items-center">
                            <Calendar className="h-5 w-5 text-[#FF69B4] mr-3" />
                            <div>
                              <h5 className="font-medium">Base Ecosystem Grants</h5>
                              <p className="text-sm text-gray-500">For artists building on Base blockchain</p>
                            </div>
                            <div className="ml-auto text-right">
                              <span className="text-sm font-medium">$5,000-$20,000</span>
                              <p className="text-xs text-[#FF69B4]">Deadline: June 30, 2025</p>
                            </div>
                          </div>

                          <div className="p-4 flex items-center">
                            <Calendar className="h-5 w-5 text-[#FF69B4] mr-3" />
                            <div>
                              <h5 className="font-medium">LATAM Creator Fund</h5>
                              <p className="text-sm text-gray-500">Specifically for Latin American artists</p>
                            </div>
                            <div className="ml-auto text-right">
                              <span className="text-sm font-medium">$1,000-$10,000</span>
                              <p className="text-xs text-[#FF69B4]">Deadline: July 15, 2025</p>
                            </div>
                          </div>

                          <div className="p-4 flex items-center">
                            <Calendar className="h-5 w-5 text-[#FF69B4] mr-3" />
                            <div>
                              <h5 className="font-medium">Web3 Art Innovation Grants</h5>
                              <p className="text-sm text-gray-500">For experimental digital art projects</p>
                            </div>
                            <div className="ml-auto text-right">
                              <span className="text-sm font-medium">Up to $15,000</span>
                              <p className="text-xs text-[#FF69B4]">Deadline: August 1, 2025</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h4 className="font-semibold mb-2">Grant Application Tips</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="bg-[#9ACD32] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                            ✓
                          </span>
                          <span>Clearly explain how your project utilizes blockchain technology</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-[#9ACD32] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                            ✓
                          </span>
                          <span>Include a detailed budget and timeline</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-[#9ACD32] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                            ✓
                          </span>
                          <span>Highlight the innovation or unique aspects of your work</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-[#9ACD32] text-white rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                            ✓
                          </span>
                          <span>Demonstrate community engagement or impact</span>
                        </li>
                      </ul>
                    </div>

                    <Link href="/ai-agent?topic=web3-grants">
                      <Button className="w-full bg-[#FF69B4] hover:bg-[#FF1493]">
                        Get Grant Application Help
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplaces" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-[#9ACD32]/20 p-3 rounded-full flex-shrink-0">
                    <Globe className="h-6 w-6 text-[#9ACD32]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">NFT Marketplaces</h3>
                    <p className="text-gray-600 mb-4">
                      Discover the best platforms to showcase and sell your digital artwork as NFTs, each with unique
                      features and communities.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-[#FF69B4]/10 p-3">
                          <h4 className="font-medium">Popular Marketplaces</h4>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                              <Image
                                src="/zora-warrior.png"
                                alt="Zora"
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            </div>
                            <div>
                              <h5 className="font-medium">Zora</h5>
                              <p className="text-xs text-gray-500">Creator-owned NFT marketplace on Base</p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                              <Image
                                src="/opensea-marketplace.png"
                                alt="OpenSea"
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            </div>
                            <div>
                              <h5 className="font-medium">OpenSea</h5>
                              <p className="text-xs text-gray-500">Largest NFT marketplace with wide reach</p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                              <Image
                                src="/foundation-abstract.png"
                                alt="Foundation"
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            </div>
                            <div>
                              <h5 className="font-medium">Foundation</h5>
                              <p className="text-xs text-gray-500">Curated platform for digital art</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-[#9ACD32]/10 p-3">
                          <h4 className="font-medium">LATAM-Focused Platforms</h4>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                              <Image
                                src="/tropical-island-getaway.png"
                                alt="Tropix"
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            </div>
                            <div>
                              <h5 className="font-medium">Tropix</h5>
                              <p className="text-xs text-gray-500">Brazilian NFT platform for Latin American art</p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                              <Image
                                src="/placeholder.svg?height=32&width=32&query=Mintbase"
                                alt="Mintbase"
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            </div>
                            <div>
                              <h5 className="font-medium">Mintbase</h5>
                              <p className="text-xs text-gray-500">Growing presence in LATAM creative communities</p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                              <Image
                                src="/placeholder.svg?height=32&width=32&query=Artblocks"
                                alt="Art Blocks"
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            </div>
                            <div>
                              <h5 className="font-medium">Art Blocks</h5>
                              <p className="text-xs text-gray-500">Generative art platform with LATAM artists</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-[#FF69B4]/10 to-[#9ACD32]/10 p-4 rounded-lg mb-6">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Award className="h-5 w-5 mr-2 text-[#FF69B4]" />
                        Success Story
                      </h4>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src="/placeholder.svg?height=96&width=96&query=digital%20art%20success"
                            alt="Success Story"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h5 className="font-medium">Maria Gonzalez, Digital Artist from Mexico City</h5>
                          <p className="text-sm text-gray-600">
                            "I started minting my digital illustrations as NFTs last year. Within 6 months, I earned
                            more than my previous annual salary and built connections with collectors worldwide. The
                            royalties from secondary sales continue to provide passive income."
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link href="/create">
                      <Button className="w-full bg-[#9ACD32] hover:bg-[#7CFC00]">
                        Start Minting on Base
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div id="get-started" className="scroll-mt-16">
          <Card className="border-2 border-[#FF69B4]">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4 text-center">Ready to Start Your Web3 Journey?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="bg-[#FF69B4]/20 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-6 w-6 text-[#FF69B4]" />
                    </div>
                    <h4 className="font-semibold mb-2">Create Your First NFT</h4>
                    <p className="text-sm text-gray-600 mb-4">Mint your artwork on the Base blockchain</p>
                    <Link href="/create">
                      <Button variant="outline" size="sm" className="w-full">
                        Start Creating
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="bg-[#9ACD32]/20 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-[#9ACD32]" />
                    </div>
                    <h4 className="font-semibold mb-2">Join the Community</h4>
                    <p className="text-sm text-gray-600 mb-4">Connect with other Web3 artists and collectors</p>
                    <Button variant="outline" size="sm" className="w-full">
                      Find Communities
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="bg-[#FF69B4]/20 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Lightbulb className="h-6 w-6 text-[#FF69B4]" />
                    </div>
                    <h4 className="font-semibold mb-2">Learn More</h4>
                    <p className="text-sm text-gray-600 mb-4">Ask our agent about Web3 opportunities</p>
                    <Link href="/ai-agent?topic=web3-for-artists">
                      <Button variant="outline" size="sm" className="w-full">
                        Ask Agent
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Link href="/create">
                  <Button className="bg-gradient-to-r from-[#FF69B4] to-[#9ACD32] hover:from-[#FF1493] hover:to-[#7CFC00] text-white px-8">
                    Begin Your Web3 Art Journey
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
