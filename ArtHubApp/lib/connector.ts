import sdk from "@farcaster/frame-sdk";
import { SwitchChainError, fromHex, getAddress, numberToHex } from "viem";
import { ChainNotConfiguredError, createConnector } from "wagmi";

frameConnector.type = "frameConnector" as const;

export function frameConnector() {
  let connected = true;

  return createConnector<typeof sdk.wallet.ethProvider>((config) => ({
    id: "farcaster",
    name: "Farcaster Wallet",
    type: frameConnector.type,

    async setup() {
      // Don't auto-connect in setup to avoid popups
      // Connection will be handled explicitly by the connect-menu component
      console.log('Farcaster frameConnector setup completed');
    },
    async connect({ chainId } = {}) {
      try {
        // Verify we're in Farcaster context before connecting
        const context = await sdk.context;
        if (!context?.client?.clientFid) {
          throw new Error('Not in Farcaster context');
        }

        const provider = await this.getProvider();
        
        // In Farcaster, the wallet should already be authorized, so this shouldn't show a popup
        const accounts = await provider.request({
          method: "eth_requestAccounts",
        });

        let currentChainId = await this.getChainId();
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain!({ chainId });
          currentChainId = chain.id;
        }

        connected = true;
        console.log('Farcaster wallet connected successfully');

        return {
          accounts: accounts.map((x) => getAddress(x)),
          chainId: currentChainId,
        };
      } catch (error) {
        console.error('Failed to connect Farcaster wallet:', error);
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
        method: "eth_requestAccounts",
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

        if (!connected) {
          return false;
        }

        const accounts = await this.getAccounts();
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