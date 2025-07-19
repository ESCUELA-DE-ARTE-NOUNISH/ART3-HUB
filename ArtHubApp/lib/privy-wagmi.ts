import { createConfig } from '@privy-io/wagmi'
import { http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { NextRequest } from 'next/server';

export interface PrivyLinkedAccount {
  type: string;
  address?: string;
  email?: string;
  phoneNumber?: string;
  subject?: string;
  name?: string;
  username?: string;
  firstVerifiedAt?: string;
  latestVerifiedAt?: string;
}

export interface PrivyUser {
  id: string;
  linkedAccounts?: PrivyLinkedAccount[];
  email?: {
    address: string;
    verified: boolean;
  };
  phone?: {
    number: string;
    verified: boolean;
  };
}

export async function getPrivyUserFromRequest(req: NextRequest): Promise<PrivyUser | null> {
  try {
    // Extract token from cookies using the correct cookie names
    const authToken = req.cookies.get('privy-token')?.value;
    if (!authToken) {
      return null;
    }

    // This is a simplified implementation - in a real app, you'd validate the token
    // with Privy's API and get the user data
    // For now, we'll extract the user ID from the auth cookies
    const privyUserCookie = req.cookies.get('privy-user');
    if (!privyUserCookie) {
      return null;
    }

    try {
      // Parse user data from cookie
      const userData = JSON.parse(privyUserCookie.value);
      return userData as PrivyUser;
    } catch (e) {
      console.error('Error parsing Privy user data:', e);
      return null;
    }
  } catch (error) {
    console.error('Error getting Privy user from request:', error);
    return null;
  }
}

// Function to create Wagmi config (called client-side)
export function createPrivyWagmiConfig() {
  // Get default chain based on testing mode
  const isTestingMode = process.env.NEXT_PUBLIC_IS_TESTING_MODE === 'true'
  const targetChain = isTestingMode ? baseSepolia : base

  // Configure chain-specific settings
  const chainConfig = {
    [base.id]: {
      ...base,
      rpcUrls: {
        ...base.rpcUrls,
        default: { http: [process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'] },
      }
    },
    [baseSepolia.id]: {
      ...baseSepolia,
      rpcUrls: {
        ...baseSepolia.rpcUrls,
        default: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'] },
      }
    }
  }

  const configuredChain = chainConfig[targetChain.id]

  return createConfig({
    chains: [configuredChain],
    transports: {
      [configuredChain.id]: http(),
    },
  })
}

// Export config directly for server-side compatibility
export const privyWagmiConfig = createPrivyWagmiConfig()