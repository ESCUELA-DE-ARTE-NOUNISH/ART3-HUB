import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { 
  SubscriptionManager,
  Art3HubCollectionV2,
  Art3HubFactoryV2,
  GaslessRelayer
} from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Art3Hub V2 Contracts", function () {
  let subscriptionManager: SubscriptionManager;
  let collectionImplementation: Art3HubCollectionV2;
  let factory: Art3HubFactoryV2;
  let gaslessRelayer: GaslessRelayer;
  
  let owner: SignerWithAddress;
  let artist: SignerWithAddress;
  let user: SignerWithAddress;
  let treasury: SignerWithAddress;
  let relayer: SignerWithAddress;
  
  const PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
  const MASTER_PLAN_PRICE = ethers.parseUnits("4.99", 6); // $4.99 in USDC
  const PROXY_REGISTRY = ethers.ZeroAddress;
  
  beforeEach(async function () {
    [owner, artist, user, treasury, relayer] = await ethers.getSigners();
    
    // Deploy SubscriptionManager
    const SubscriptionManagerFactory = await ethers.getContractFactory("SubscriptionManager");
    subscriptionManager = await SubscriptionManagerFactory.deploy(treasury.address);
    
    // Deploy Collection Implementation
    const CollectionFactory = await ethers.getContractFactory("Art3HubCollectionV2");
    collectionImplementation = await CollectionFactory.deploy(PROXY_REGISTRY);
    
    // Deploy Factory
    const FactoryFactory = await ethers.getContractFactory("Art3HubFactoryV2");
    factory = await FactoryFactory.deploy(
      await collectionImplementation.getAddress(),
      await subscriptionManager.getAddress(),
      PROXY_REGISTRY,
      treasury.address,
      PLATFORM_FEE_PERCENTAGE
    );
    
    // Deploy Gasless Relayer
    const RelayerFactory = await ethers.getContractFactory("GaslessRelayer");
    gaslessRelayer = await RelayerFactory.deploy();
    
    // Configure contracts
    await subscriptionManager.setAuthorizedCaller(await factory.getAddress(), true);
    await gaslessRelayer.setAuthorizedRelayer(relayer.address, true);
    await gaslessRelayer.setAuthorizedTarget(await factory.getAddress(), true);
  });
  
  describe("SubscriptionManager", function () {
    it("Should allow user to subscribe to free plan", async function () {
      await subscriptionManager.connect(artist).subscribeToFreePlan();
      
      const subscription = await subscriptionManager.getSubscription(artist.address);
      expect(subscription.plan).to.equal(0); // FREE plan
      expect(subscription.isActive).to.be.true;
      expect(subscription.nftLimit).to.equal(1);
    });
    
    it("Should check NFT minting capability", async function () {
      await subscriptionManager.connect(artist).subscribeToFreePlan();
      
      const [canMint, remaining] = await subscriptionManager.canMintNFT(artist.address);
      expect(canMint).to.be.true;
      expect(remaining).to.equal(1);
    });
    
    it("Should prevent minting when limit exceeded", async function () {
      await subscriptionManager.connect(artist).subscribeToFreePlan();
      await subscriptionManager.recordNFTMint(artist.address, 1);
      
      const [canMint, remaining] = await subscriptionManager.canMintNFT(artist.address);
      expect(canMint).to.be.false;
      expect(remaining).to.equal(0);
    });
    
    it("Should handle subscription expiration", async function () {
      await subscriptionManager.connect(artist).subscribeToFreePlan();
      
      // Fast forward time beyond subscription period
      await time.increase(365 * 24 * 60 * 60 + 1); // 1 year + 1 second
      
      const [canMint] = await subscriptionManager.canMintNFT(artist.address);
      expect(canMint).to.be.false;
    });
    
    it("Should prevent duplicate free subscriptions", async function () {
      await subscriptionManager.connect(artist).subscribeToFreePlan();
      
      await expect(
        subscriptionManager.connect(artist).subscribeToFreePlan()
      ).to.be.revertedWith("Already has active subscription");
    });
  });
  
  describe("Art3HubFactoryV2", function () {
    beforeEach(async function () {
      // Artist subscribes to free plan
      await subscriptionManager.connect(artist).subscribeToFreePlan();
    });
    
    it("Should create NFT collection", async function () {
      const tx = await factory.connect(artist).createCollection(
        "Test Collection",
        "TEST",
        "A test collection",
        "https://example.com/image.jpg",
        "https://example.com",
        artist.address,
        500 // 5% royalty
      );
      
      await expect(tx)
        .to.emit(factory, "CollectionCreated")
        .withArgs(
          await factory.allCollections(0),
          artist.address,
          "Test Collection",
          "TEST",
          0
        );
      
      const collections = await factory.getArtistCollections(artist.address);
      expect(collections.length).to.equal(1);
    });
    
    it("Should prevent collection creation without subscription", async function () {
      await expect(
        factory.connect(user).createCollection(
          "Test Collection",
          "TEST",
          "A test collection",
          "https://example.com/image.jpg",
          "https://example.com",
          user.address,
          500
        )
      ).to.be.revertedWithCustomError(factory, "SubscriptionRequired");
    });
    
    it("Should enforce royalty limits", async function () {
      await expect(
        factory.connect(artist).createCollection(
          "Test Collection",
          "TEST",
          "A test collection",
          "https://example.com/image.jpg",
          "https://example.com",
          artist.address,
          6000 // 60% royalty - should fail
        )
      ).to.be.revertedWithCustomError(factory, "InvalidRoyalty");
    });
    
    it("Should track collections properly", async function () {
      await factory.connect(artist).createCollection(
        "Collection 1",
        "COL1",
        "First collection",
        "https://example.com/1.jpg",
        "https://example.com",
        artist.address,
        500
      );
      
      await factory.connect(artist).createCollection(
        "Collection 2",
        "COL2",
        "Second collection",
        "https://example.com/2.jpg",
        "https://example.com",
        artist.address,
        1000
      );
      
      const totalCollections = await factory.totalCollections();
      expect(totalCollections).to.equal(2);
      
      const artistCollections = await factory.getArtistCollections(artist.address);
      expect(artistCollections.length).to.equal(2);
    });
  });
  
  describe("Art3HubCollectionV2", function () {
    let collection: Art3HubCollectionV2;
    
    beforeEach(async function () {
      // Artist subscribes and creates collection
      await subscriptionManager.connect(artist).subscribeToFreePlan();
      
      await factory.connect(artist).createCollection(
        "Test Collection",
        "TEST",
        "A test collection",
        "https://example.com/image.jpg",
        "https://example.com",
        artist.address,
        500
      );
      
      const collections = await factory.getArtistCollections(artist.address);
      collection = await ethers.getContractAt("Art3HubCollectionV2", collections[0]);
    });
    
    it("Should mint NFT with valid subscription", async function () {
      const tokenURI = "https://example.com/token/1";
      
      await expect(collection.connect(artist).mint(artist.address, tokenURI))
        .to.emit(collection, "TokenMinted")
        .withArgs(artist.address, 1, tokenURI);
      
      expect(await collection.ownerOf(1)).to.equal(artist.address);
      expect(await collection.tokenURI(1)).to.equal(tokenURI);
      expect(await collection.totalSupply()).to.equal(1);
    });
    
    it("Should prevent minting without valid subscription", async function () {
      const tokenURI = "https://example.com/token/1";
      
      await expect(
        collection.connect(user).mint(user.address, tokenURI)
      ).to.be.revertedWithCustomError(collection, "SubscriptionRequired");
    });
    
    it("Should enforce minting limits", async function () {
      const tokenURI1 = "https://example.com/token/1";
      const tokenURI2 = "https://example.com/token/2";
      
      // First mint should succeed
      await collection.connect(artist).mint(artist.address, tokenURI1);
      
      // Second mint should fail (free plan limit = 1)
      await expect(
        collection.connect(artist).mint(artist.address, tokenURI2)
      ).to.be.revertedWithCustomError(collection, "MintLimitExceeded");
    });
    
    it("Should allow artist to mint regardless of subscription", async function () {
      const tokenURI = "https://example.com/token/artist";
      
      await expect(collection.connect(artist).artistMint(user.address, tokenURI))
        .to.emit(collection, "TokenMinted")
        .withArgs(user.address, 1, tokenURI);
      
      expect(await collection.ownerOf(1)).to.equal(user.address);
    });
    
    it("Should handle batch artist minting", async function () {
      const recipients = [user.address, artist.address];
      const tokenURIs = [
        "https://example.com/token/1",
        "https://example.com/token/2"
      ];
      
      await collection.connect(artist).batchArtistMint(recipients, tokenURIs);
      
      expect(await collection.totalSupply()).to.equal(2);
      expect(await collection.ownerOf(1)).to.equal(user.address);
      expect(await collection.ownerOf(2)).to.equal(artist.address);
    });
    
    it("Should support royalty standard", async function () {
      const tokenURI = "https://example.com/token/1";
      await collection.connect(artist).mint(artist.address, tokenURI);
      
      const [recipient, amount] = await collection.royaltyInfo(1, 10000);
      expect(recipient).to.equal(artist.address);
      expect(amount).to.equal(500); // 5% of 10000
    });
    
    it("Should provide contract metadata for OpenSea", async function () {
      const contractURI = await collection.contractURI();
      expect(contractURI).to.include("data:application/json;base64,");
    });
  });
  
  describe("Gasless Functionality", function () {
    let collection: Art3HubCollectionV2;
    
    beforeEach(async function () {
      await subscriptionManager.connect(artist).subscribeToFreePlan();
      
      await factory.connect(artist).createCollection(
        "Test Collection",
        "TEST",
        "A test collection",
        "https://example.com/image.jpg",
        "https://example.com",
        artist.address,
        500
      );
      
      const collections = await factory.getArtistCollections(artist.address);
      collection = await ethers.getContractAt("Art3HubCollectionV2", collections[0]);
    });
    
    it("Should handle gasless minting with valid signature", async function () {
      const tokenURI = "https://example.com/token/gasless";
      const nonce = await collection.nonces(artist.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      // Create voucher
      const voucher = {
        to: artist.address,
        tokenURI: tokenURI,
        nonce: nonce,
        deadline: deadline
      };
      
      // Sign voucher
      const domain = {
        name: "Art3HubCollectionV2",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await collection.getAddress()
      };
      
      const types = {
        MintVoucher: [
          { name: "to", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      };
      
      const signature = await artist.signTypedData(domain, types, voucher);
      
      await expect(collection.connect(relayer).gaslessMint(voucher, signature))
        .to.emit(collection, "GaslessMint")
        .withArgs(artist.address, 1, artist.address);
      
      expect(await collection.ownerOf(1)).to.equal(artist.address);
      expect(await collection.nonces(artist.address)).to.equal(nonce + 1n);
    });
  });
  
  describe("Integration Tests", function () {
    it("Should handle complete user journey", async function () {
      // 1. Artist subscribes to free plan
      await subscriptionManager.connect(artist).subscribeToFreePlan();
      
      // 2. Artist creates collection
      await factory.connect(artist).createCollection(
        "My Art Collection",
        "MAC",
        "Beautiful digital art",
        "https://example.com/collection.jpg",
        "https://mysite.com",
        artist.address,
        750 // 7.5% royalty
      );
      
      // 3. Get collection address
      const collections = await factory.getArtistCollections(artist.address);
      const collection = await ethers.getContractAt("Art3HubCollectionV2", collections[0]);
      
      // 4. Artist mints NFT
      await collection.connect(artist).mint(
        artist.address,
        "https://example.com/token/artwork1"
      );
      
      // 5. Verify NFT ownership and metadata
      expect(await collection.ownerOf(1)).to.equal(artist.address);
      expect(await collection.totalSupply()).to.equal(1);
      
      // 6. Check royalty info
      const [royaltyRecipient, royaltyAmount] = await collection.royaltyInfo(1, 10000);
      expect(royaltyRecipient).to.equal(artist.address);
      expect(royaltyAmount).to.equal(750);
      
      // 7. Verify subscription state
      const [canMint, remaining] = await subscriptionManager.canMintNFT(artist.address);
      expect(canMint).to.be.false; // Used up free mint
      expect(remaining).to.equal(0);
    });
  });
});