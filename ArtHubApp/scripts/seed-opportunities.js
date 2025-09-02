// Seed script for opportunities data
// Run with: NEXT_PUBLIC_SITE_URL=http://localhost:3000 node scripts/seed-opportunities.js

const sampleOpportunities = [
  {
    title: "Innovate Grant (Art + Photo)",
    organization: "Innovate Artist Grants",
    description: "You've been building your visual style with limited resources. This grant gives you the financial push to create freely and the recognition to get your work in front of international eyes.",
    url: "https://innovateartistgrants.org",
    amount: "$1,800 USD",
    amount_min: 1800,
    amount_max: 1800,
    currency: "USD",
    deadline: "September 10, 2025",
    category: "grant",
    location: "International",
    eligibility: ["Visual artists", "Photographers", "Emerging artists"],
    tags: ["photography", "visual arts", "international", "emerging artists"],
    status: "published",
    featured: true,
    difficulty_level: "intermediate",
    application_requirements: [
      "Portfolio of 10-15 works",
      "Artist statement (500 words max)",
      "Project proposal",
      "Budget breakdown"
    ],
    contact_email: "grants@innovateartistgrants.org",
    notes: "Perfect for artists building their visual style with limited resources",
    created_by: "admin"
  },
  {
    title: "Portland Small Grants Program",
    organization: "City of Portland Arts Department",
    description: "Your projects always carry a community-driven angle. This program supports artists who bring people together through their art — exactly the kind of initiative that amplifies your impact.",
    url: "https://www.portland.gov/arts/small-grants-program",
    amount: "Up to $5,000",
    amount_min: 500,
    amount_max: 5000,
    currency: "USD",
    deadline: "September 12, 2025",
    category: "grant",
    location: "Portland, OR, USA",
    eligibility: ["Portland residents", "Community-focused projects"],
    tags: ["community", "local", "portland", "social impact"],
    status: "published",
    featured: false,
    difficulty_level: "beginner",
    application_requirements: [
      "Proof of Portland residency",
      "Project description",
      "Community impact statement",
      "Budget under $5,000"
    ],
    notes: "Supports community-driven art projects",
    created_by: "admin"
  },
  {
    title: "Manhattan Arts Grants (LMCC)",
    organization: "Lower Manhattan Cultural Council",
    description: "You're ready to move your art from private spaces into the public sphere. This grant is designed for artists like you, whose work can transform urban environments and connect with diverse communities.",
    url: "https://lmcc.net/resources/manhattan-arts-grants",
    amount: "Varies",
    amount_min: 2000,
    amount_max: 15000,
    currency: "USD",
    deadline: "September 16, 2025",
    category: "grant",
    location: "New York, NY, USA",
    eligibility: ["NYC artists", "Public art projects"],
    tags: ["public art", "nyc", "urban", "community engagement"],
    status: "published",
    featured: true,
    difficulty_level: "intermediate",
    application_requirements: [
      "NYC residency",
      "Public art proposal",
      "Community engagement plan",
      "Site-specific concept"
    ],
    notes: "Focus on public sphere and urban transformation",
    created_by: "admin"
  },
  {
    title: "Artist Support Grants – Arts & Science Council",
    organization: "Arts & Science Council",
    description: "You already have a project in progress that deserves more than sketches and drafts. This grant covers production and training costs, giving you what you need to complete it at the level it deserves.",
    url: "https://artsandscience.org/artist-support-grants",
    amount: "Up to $3,000",
    amount_min: 500,
    amount_max: 3000,
    currency: "USD",
    deadline: "September 7, 2025",
    category: "grant",
    location: "Charlotte, NC, USA",
    eligibility: ["Regional artists", "Projects in progress"],
    tags: ["production costs", "training", "project completion", "regional"],
    status: "published",
    featured: false,
    difficulty_level: "intermediate",
    application_requirements: [
      "Work samples of project in progress",
      "Production budget",
      "Timeline for completion",
      "Training plan if applicable"
    ],
    notes: "Covers production and training costs for ongoing projects",
    created_by: "admin"
  },
  {
    title: "NEA Partnership/Research Grants (USA)",
    organization: "National Endowment for the Arts",
    description: "Your work has grown beyond aesthetics — it's about research and cultural impact. The NEA is where projects like yours get recognized and funded at the highest level.",
    url: "https://www.arts.gov/grants",
    amount: "$10,000 - $100,000",
    amount_min: 10000,
    amount_max: 100000,
    currency: "USD",
    deadline: "September 25, 2025",
    category: "grant",
    location: "USA",
    eligibility: ["US organizations", "Research-based projects", "Cultural impact focus"],
    tags: ["research", "cultural impact", "federal grant", "high funding"],
    status: "published",
    featured: true,
    difficulty_level: "advanced",
    application_requirements: [
      "501(c)(3) organization or fiscal sponsor",
      "Detailed research proposal",
      "Cultural impact assessment",
      "Comprehensive budget",
      "Letters of support"
    ],
    contact_email: "grants@arts.gov",
    notes: "Federal grant for research-based cultural projects",
    created_by: "admin"
  },
  {
    title: "Hayama Artist Residency (Japan)",
    organization: "Hayama Arts Centre",
    description: "You've been searching for a space to experiment outside your usual environment. This residency gives you time, resources, and immersion in Japanese culture to take your art into a completely new dimension.",
    url: "https://creative-capital.org/artist-resources/artist-opportunities",
    amount: "Full funding + stipend",
    amount_min: 5000,
    amount_max: 8000,
    currency: "USD",
    deadline: "September 30, 2025",
    category: "residency",
    location: "Hayama, Japan",
    eligibility: ["International artists", "All mediums welcome"],
    tags: ["residency", "japan", "cultural exchange", "international", "stipend"],
    status: "published",
    featured: true,
    difficulty_level: "intermediate",
    application_requirements: [
      "Artist portfolio",
      "Residency proposal",
      "Cultural exchange statement",
      "Valid passport",
      "Basic Japanese language skills preferred"
    ],
    notes: "Includes accommodation, studio space, and cultural immersion",
    created_by: "admin"
  },
  {
    title: "Orange County Public Art Commission (Florida, USA)",
    organization: "Orange County Arts & Cultural Affairs",
    description: "You've envisioned your art reaching massive audiences. This commission brings your vision into public space, backed by a $48,500 budget, ensuring your work impacts thousands every day.",
    url: "https://creative-capital.org/artist-resources/artist-opportunities",
    amount: "$48,500",
    amount_min: 48500,
    amount_max: 48500,
    currency: "USD",
    deadline: "September 9, 2025",
    category: "commission",
    location: "Orange County, FL, USA",
    eligibility: ["Professional artists", "Public art experience"],
    tags: ["public art", "commission", "florida", "large scale", "permanent installation"],
    status: "published",
    featured: true,
    difficulty_level: "advanced",
    application_requirements: [
      "Professional portfolio",
      "Public art experience",
      "Site-specific proposal",
      "Detailed budget",
      "Installation timeline",
      "Maintenance plan"
    ],
    notes: "Large-scale public art commission with significant budget",
    created_by: "admin"
  }
]

async function seedOpportunities() {
  console.log('🌱 Starting opportunity seeding process...')
  
  try {
    for (let i = 0; i < sampleOpportunities.length; i++) {
      const opp = sampleOpportunities[i]
      console.log(`📝 Creating opportunity ${i + 1}/${sampleOpportunities.length}: ${opp.title}`)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(opp),
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Created: ${opp.title}`)
      } else {
        console.error(`❌ Failed to create ${opp.title}:`, result.error)
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log('🎉 Opportunity seeding completed!')
    
    // Fetch and display the created opportunities
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/opportunities?admin=true`)
    const result = await response.json()
    
    if (result.success) {
      console.log(`📊 Total opportunities in database: ${result.count}`)
      result.data.forEach((opp, index) => {
        console.log(`${index + 1}. ${opp.title} (${opp.category}) - ${opp.deadline}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
  }
}

// Run the seeding
seedOpportunities()