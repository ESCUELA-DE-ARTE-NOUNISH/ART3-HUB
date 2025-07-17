import { NFTClaimForm } from '@/components/NFTClaimForm'

export default function NFTClaimPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Claim Your Exclusive NFT</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          If you've received a special claim code, enter it below to mint your NFT directly to your wallet.
        </p>
      </div>
      
      <NFTClaimForm />
      
      <div className="mt-12 bg-muted rounded-lg p-6 max-w-md mx-auto">
        <h2 className="font-medium mb-2">How it works</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Enter your claim code in the field above</li>
          <li>Verify the code to see the NFT you'll receive</li>
          <li>Click "Claim NFT" to mint directly to your wallet</li>
          <li>Your NFT will appear in your wallet and on your profile</li>
        </ol>
        
        <p className="mt-4 text-sm text-muted-foreground">
          Need help? Contact us at <a href="mailto:support@art3hub.com" className="underline">support@art3hub.com</a>
        </p>
      </div>
    </div>
  )
} 