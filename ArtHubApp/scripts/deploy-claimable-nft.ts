#!/usr/bin/env npx tsx

import { createPublicClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base, baseSepolia } from 'viem/chains'

// Simple ERC721 contract bytecode for claimable NFTs
const CLAIMABLE_NFT_BYTECODE = "0x608060405234801561001057600080fd5b50604051610a9e380380610a9e8339818101604052810190610032919061007a565b8181816000908051906020019061004a9291906100ed565b5080600190805190602001906100619291906100ed565b50505050505061017c565b600080fd5b600080fd5b600080fd5b600080fd5b60008151905061008b8161016f565b92915050565b6000602082840312156100a7576100a661006a565b5b60006100b58482850161007c565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061013557607f821691505b602082108103610148576101476100ee565b5b50919050565b61015881610154565b811461016357600080fd5b50565b61016f8161014e565b82525050565b600061018082610166565b9050919050565b610913806101956000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c8063a22cb4651161005b578063a22cb46514610161578063b88d4fde1461017d578063c87b56dd14610199578063e985e9c5146101c957610088565b806301ffc9a71461008d57806306fdde03146100bd578063081812fc146100db578063095ea7b31461010b57806323b872dd14610127575b600080fd5b6100a760048036038101906100a2919061065a565b6101f9565b6040516100b491906106a2565b60405180910390f35b6100c56102db565b6040516100d2919061074d565b60405180910390f35b6100f560048036038101906100f091906107a5565b61036d565b6040516101029190610813565b60405180910390f35b61012560048036038101906101209190610856565b6103b3565b005b610141600480360381019061013c9190610896565b6104ca565b005b61014961052a565b005b61017b60048036038101906101769190610925565b6105be565b005b61019760048036038101906101929190610a95565b610634565b005b6101b360048036038101906101ae91906107a5565b610696565b6040516101c0919061074d565b60405180910390f35b6101e360048036038101906101de9190610b18565b610737565b6040516101f091906106a2565b60405180910390f35b60007f80ac58cd000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614806102c457507f5b5e139f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916145b806102d457506102d3826107cb565b5b9050919050565b6060600080546102ea90610b87565b80601f016020809104026020016040519081016040528092919081815260200182805461031690610b87565b80156103635780601f1061033857610100808354040283529160200191610363565b820191906000526020600020905b81548152906001019060200180831161034657829003601f168201915b5050505050905090565b600061037882610835565b6004600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b60006103be82610880565b90508073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16141561042f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161042690610c2a565b60405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff1661044e61094e565b73ffffffffffffffffffffffffffffffffffffffff16148061047d575061047c8161047761094e565b610737565b5b6104bc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104b390610cbc565b60405180910390fd5b6104c68383610956565b5050565b6104db6104d561094e565b82610a0f565b61051a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161051190610d4e565b60405180910390fd5b610525838383610aed565b505050565b61053261094e565b73ffffffffffffffffffffffffffffffffffffffff16610550610d49565b73ffffffffffffffffffffffffffffffffffffffff16146105a6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161059d90610dba565b60405180910390fd5b6105bc6105b161094e565b6007546105c7565b565b6105c661094e565b73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415610634576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161062b90610e26565b60405180910390fd5b806005600061064161094e565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff166106ee61094e565b73ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c318360405161073391906106a2565b60405180910390a35050565b6000610747838361074d908573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905092915050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156107b7576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107ae90610e92565b60405180910390fd5b6107c760008383610e7d565b5050565b505050565b505050505050565b600080fd5b600080fd5b600080fd5b600080fd5b6000819050919050565b6107f5816107e2565b811461080057600080fd5b50565b600081359050610812816107ec565b92915050565b60006020828403121561082e5761082d6107dd565b5b600061083c84828501610803565b91505092915050565b6000610850826107e2565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061088282610857565b9050919050565b61089281610877565b811461089d57600080fd5b50565b6000813590506108af81610889565b92915050565b600080604083850312156108cc576108cb6107dd565b5b60006108da858286016108a0565b92505060206108eb85828601610803565b9150509250929050565b600080600060608486031215610914576109136107dd565b5b600061092286828701610803565b9350506020610933868287016108a0565b9250506040610944868287016108a0565b9150509250925092565b600033905090565b816004600083815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808273ffffffffffffffffffffffffffffffffffffffff166109c983610880565b73ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b600080610a1b83610880565b90508073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161480610a5d5750610a5c8185610737565b5b80610a9b57508373ffffffffffffffffffffffffffffffffffffffff16610a838461036d565b73ffffffffffffffffffffffffffffffffffffffff16145b91505092915050565b610aa4838383610cf9565b808273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4505050565b5050565b5050"

// Simple ERC721 ABI for deployment
const ERC721_ABI = [
  {
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenURI", type: "string" }
    ],
    name: "mint",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  }
] as const

async function deployClaimableNFT(network: 'testnet' | 'mainnet') {
  console.log(`🚀 Deploying ClaimableNFT contract to ${network}...`)
  
  // Get environment variables
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY
  if (!adminPrivateKey) {
    throw new Error('ADMIN_PRIVATE_KEY environment variable not set')
  }
  
  // Select the appropriate chain
  const chain = network === 'mainnet' ? base : baseSepolia
  
  console.log(`Using chain: ${chain.name} (ID: ${chain.id})`)
  
  // Create admin account from private key
  const adminAccount = privateKeyToAccount(adminPrivateKey as `0x${string}`)
  console.log(`Deploying from admin account: ${adminAccount.address}`)
  
  // Create clients
  const publicClient = createPublicClient({
    chain,
    transport: http()
  })
  
  const walletClient = createWalletClient({
    account: adminAccount,
    chain,
    transport: http()
  })
  
  try {
    // Check account balance
    const balance = await publicClient.getBalance({ address: adminAccount.address })
    console.log(`Admin account balance: ${Number(balance) / 1e18} ETH`)
    
    if (balance < parseEther('0.001')) {
      throw new Error('Insufficient balance for deployment. Need at least 0.001 ETH.')
    }
    
    // Deploy the contract
    console.log('Deploying contract...')
    
    const hash = await walletClient.deployContract({
      abi: ERC721_ABI,
      bytecode: CLAIMABLE_NFT_BYTECODE as `0x${string}`,
      args: ["Art3Hub Claimable NFT", "A3CLAIM"]
    })
    
    console.log(`Deployment transaction submitted: ${hash}`)
    
    // Wait for deployment to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    if (receipt.status === 'success' && receipt.contractAddress) {
      console.log(`✅ Contract deployed successfully!`)
      console.log(`Contract address: ${receipt.contractAddress}`)
      console.log(`Transaction hash: ${hash}`)
      console.log(`Gas used: ${receipt.gasUsed}`)
      
      const envVarName = network === 'mainnet' 
        ? 'NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_8453'
        : 'NEXT_PUBLIC_CLAIMABLE_NFT_CONTRACT_84532'
      
      console.log(`\n📝 Add this to your .env file:`)
      console.log(`${envVarName}=${receipt.contractAddress}`)
      
      return {
        contractAddress: receipt.contractAddress,
        txHash: hash,
        network: chain.name,
        envVarName
      }
    } else {
      throw new Error('Contract deployment failed')
    }
  } catch (error) {
    console.error(`❌ Deployment failed:`, error)
    throw error
  }
}

async function main() {
  const args = process.argv.slice(2)
  const network = args[0] as 'testnet' | 'mainnet'
  
  if (!network || !['testnet', 'mainnet'].includes(network)) {
    console.log('Usage: npx tsx scripts/deploy-claimable-nft.ts <testnet|mainnet>')
    process.exit(1)
  }
  
  try {
    const result = await deployClaimableNFT(network)
    
    console.log('\n🎉 Deployment completed successfully!')
    console.log('Next steps:')
    console.log('1. Add the environment variable to your .env file')
    console.log('2. Restart your development server')
    console.log('3. Test the claimable NFT functionality')
    
  } catch (error) {
    console.error('Deployment failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}