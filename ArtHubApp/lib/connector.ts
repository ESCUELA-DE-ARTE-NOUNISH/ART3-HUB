import { sdk } from "@farcaster/miniapp-sdk";
import { SwitchChainError, fromHex, getAddress, numberToHex } from "viem";
import { ChainNotConfiguredError, createConnector } from "wagmi";

export function frameConnector() {
  let connected = false;

  return createConnector<typeof sdk.wallet.ethProvider>((config) => ({
    id: "frameConnector", // Changed to match the type
    name: "Farcaster Wallet",
    type: "frameConnector" as const,

    async setup() {
      // Don't auto-connect in setup to avoid popups
      // Connection will be handled explicitly by the connect-menu component
      console.log('Farcaster frameConnector setup completed');
    },
    async connect({ chainId } = {}) {
      try {
        console.log('🔄 Farcaster connector: Starting connection process...');
        
        // Verify we're in Farcaster context before connecting
        const context = await sdk.context;
        console.log('🔍 Farcaster context:', context ? 'Available' : 'Not available');
        
        if (!context?.client?.clientFid) {
          throw new Error('Not in Farcaster context - clientFid not found');
        }

        console.log('✅ Farcaster context verified, clientFid:', context.client.clientFid);

        const provider = await this.getProvider();
        console.log('✅ Farcaster provider obtained');
        
        // In Farcaster Mini Apps, the wallet is already connected
        // We don't need to call eth_requestAccounts as it triggers external wallets
        console.log('🔄 Getting Farcaster wallet accounts directly...');
        
        // Get accounts directly from the provider without requesting permission
        let accounts;
        try {
          // Try to get accounts without requesting (should be already available in Farcaster)
          accounts = await provider.request({
            method: "eth_accounts", // Use eth_accounts instead of eth_requestAccounts
          });
          console.log('✅ Farcaster accounts retrieved:', accounts);
        } catch (error) {
          console.log('⚠️ eth_accounts failed, trying alternative approach:', error);
          // If that fails, we might need to use a different approach
          // For now, let's assume the user has an account connected in Farcaster
          accounts = [];
        }

        // If no accounts found through eth_accounts, the wallet might not be properly initialized
        if (!accounts || accounts.length === 0) {
          console.log('⚠️ No accounts found, wallet might not be initialized in Farcaster');
          // In Farcaster Mini Apps, there should always be a connected wallet
          // If not, we might need to initialize it differently
          throw new Error('No Farcaster wallet accounts available');
        }

        let currentChainId = await this.getChainId();
        console.log('🔍 Current chain ID:', currentChainId);
        
        if (chainId && currentChainId !== chainId) {
          console.log('🔄 Switching to requested chain:', chainId);
          const chain = await this.switchChain!({ chainId });
          currentChainId = chain.id;
          console.log('✅ Chain switched to:', currentChainId);
        }

        connected = true;
        console.log('✅ Farcaster wallet connected successfully');

        return {
          accounts: accounts.map((x) => getAddress(x)),
          chainId: currentChainId,
        };
      } catch (error) {
        console.error('❌ Failed to connect Farcaster wallet:', error);
        connected = false;
        throw error;
      }
    },
    async disconnect() {
      connected = false;
    },
    async getAccounts() {
      if (!connected) throw new Error("Not connected");
      const provider = await this.getProvider();
      const accounts = await provider.request({
        method: "eth_accounts", // Use eth_accounts instead of eth_requestAccounts
      });
      return accounts.map((x) => getAddress(x));
    },
    async getChainId() {
      const provider = await this.getProvider();
      const hexChainId = await provider.request({ method: "eth_chainId" });
      return fromHex(hexChainId, "number");
    },
    async isAuthorized() {
      try {
        // Check if we're in Farcaster context first
        const context = await sdk.context;
        if (!context?.client?.clientFid) {
          return false;
        }

        // In Farcaster Mini Apps, if we have context, the wallet should be available
        // Let's check if we can get accounts without triggering external wallet connections
        const provider = await this.getProvider();
        const accounts = await provider.request({
          method: "eth_accounts", // Use eth_accounts to check without requesting
        });
        
        return !!accounts.length;
      } catch (error) {
        console.error('Error checking Farcaster authorization:', error);
        return false;
      }
    },
    async switchChain({ chainId }) {
      const provider = await this.getProvider();
      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: numberToHex(chainId) }],
      });
      return chain;
    },
    onAccountsChanged(accounts) {
      if (accounts.length === 0) this.onDisconnect();
      else
        config.emitter.emit("change", {
          accounts: accounts.map((x) => getAddress(x)),
        });
    },
    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit("change", { chainId });
    },
    async onDisconnect() {
      config.emitter.emit("disconnect");
      connected = false;
    },
    async getProvider() {
      return sdk.wallet.ethProvider;
    },
  }));
} 