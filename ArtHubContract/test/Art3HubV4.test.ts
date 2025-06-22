import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Art3HubSubscriptionV4, Art3HubFactoryV4, Art3HubCollectionV4 } from "../typechain-types";

describe("Art3Hub V4 Test Suite", function () {
  let subscription: Art3HubSubscriptionV4;
  let factory: Art3HubFactoryV4;
  let mockUSDC: any;
  
  let owner: SignerWithAddress;
  let artist: SignerWithAddress;
  let user: SignerWithAddress;
  let treasury: SignerWithAddress;
  let relayer: SignerWithAddress;

  beforeEach(async function () {
    [owner, artist, user, treasury, relayer] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockUSDC.deploy("Mock USDC", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Mint USDC to users for testing
    await mockUSDC.mint(artist.address, ethers.parseUnits("1000", 6)); // $1000 USDC
    await mockUSDC.mint(user.address, ethers.parseUnits("1000", 6));   // $1000 USDC

    // Deploy Art3HubSubscriptionV4
    const SubscriptionV4 = await ethers.getContractFactory("Art3HubSubscriptionV4");
    subscription = await SubscriptionV4.deploy(
      await mockUSDC.getAddress(),
      treasury.address,
      relayer.address,
      owner.address, // Temporary factory address
      owner.address
    );
    await subscription.waitForDeployment();

    // Deploy Art3HubFactoryV4
    const FactoryV4 = await ethers.getContractFactory("Art3HubFactoryV4");
    factory = await FactoryV4.deploy(
      await subscription.getAddress(),
      relayer.address,
      owner.address
    );
    await factory.waitForDeployment();

    // Update factory reference in subscription
    await subscription.updateFactoryContract(await factory.getAddress());
  });

  describe("Subscription Plans", function () {
    it("Should have correct plan configurations", async function () {
      // Check FREE plan
      const [freePrice, freeLimit, freeGasless] = await subscription.getPlanConfig(0);
      expect(freePrice).to.equal(0);
      expect(freeLimit).to.equal(1); // 1 NFT per month
      expect(freeGasless).to.be.true;

      // Check MASTER plan
      const [masterPrice, masterLimit, masterGasless] = await subscription.getPlanConfig(1);
      expect(masterPrice).to.equal(ethers.parseUnits("4.99", 6)); // $4.99 USDC
      expect(masterLimit).to.equal(10); // 10 NFTs per month
      expect(masterGasless).to.be.true;

      // Check ELITE plan
      const [elitePrice, eliteLimit, eliteGasless] = await subscription.getPlanConfig(2);
      expect(elitePrice).to.equal(ethers.parseUnits("9.99", 6)); // $9.99 USDC
      expect(eliteLimit).to.equal(25); // 25 NFTs per month
      expect(eliteGasless).to.be.true;
    });

    it("Should get plan names correctly", async function () {
      expect(await subscription.getPlanName(0)).to.equal("Free");
      expect(await subscription.getPlanName(1)).to.equal("Master");
      expect(await subscription.getPlanName(2)).to.equal("Elite Creator");
    });
  });

  describe("Free Plan Auto-Enrollment", function () {
    it("Should auto-enroll new users in Free plan", async function () {
      // Check user can mint (auto-enrollment)
      expect(await subscription.canUserMint(user.address, 1)).to.be.true;
      
      // Auto-enroll user
      await subscription.connect(relayer).autoEnrollFreePlan(user.address);
      
      const [plan, expiresAt, nftsMinted, nftLimit, isActive] = 
        await subscription.getSubscription(user.address);
      
      expect(plan).to.equal(0); // FREE plan
      expect(nftLimit).to.equal(1); // 1 NFT per month
      expect(isActive).to.be.true;
      expect(nftsMinted).to.equal(0);
    });

    it("Should allow Free plan users to mint 1 NFT per month", async function () {
      await subscription.connect(user).subscribeToFreePlan();
      
      // Should be able to mint 1 NFT
      expect(await subscription.canUserMint(user.address, 1)).to.be.true;
      
      // Should not be able to mint 2 NFTs
      expect(await subscription.canUserMint(user.address, 2)).to.be.false;
    });
  });

  describe("Master Plan Subscription", function () {
    it("Should allow users to subscribe to Master plan", async function () {
      // Approve USDC spend
      await mockUSDC.connect(artist).approve(
        await subscription.getAddress(), 
        ethers.parseUnits("4.99", 6)
      );

      // Subscribe to Master plan
      await subscription.connect(artist).subscribeToMasterPlan(true);

      const [plan, expiresAt, nftsMinted, nftLimit, isActive] = 
        await subscription.getSubscription(artist.address);

      expect(plan).to.equal(1); // MASTER plan
      expect(nftLimit).to.equal(10); // 10 NFTs per month
      expect(isActive).to.be.true;
      expect(nftsMinted).to.equal(0);
    });

    it("Should transfer USDC to treasury on Master plan subscription", async function () {
      const treasuryBalanceBefore = await mockUSDC.balanceOf(treasury.address);
      
      await mockUSDC.connect(artist).approve(
        await subscription.getAddress(), 
        ethers.parseUnits("4.99", 6)
      );

      await subscription.connect(artist).subscribeToMasterPlan(false);

      const treasuryBalanceAfter = await mockUSDC.balanceOf(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(
        ethers.parseUnits("4.99", 6)
      );
    });

    it("Should allow Master plan gasless subscription", async function () {
      await mockUSDC.connect(artist).approve(
        await subscription.getAddress(), 
        ethers.parseUnits("4.99", 6)
      );

      await subscription.connect(relayer).subscribeToMasterPlanGasless(artist.address, false);

      const [plan, , , nftLimit, isActive] = 
        await subscription.getSubscription(artist.address);

      expect(plan).to.equal(1); // MASTER plan
      expect(nftLimit).to.equal(10);
      expect(isActive).to.be.true;
    });
  });

  describe("Elite Creator Plan Subscription", function () {
    it("Should allow users to subscribe to Elite plan", async function () {
      await mockUSDC.connect(artist).approve(
        await subscription.getAddress(), 
        ethers.parseUnits("9.99", 6)
      );

      await subscription.connect(artist).subscribeToElitePlan(true);

      const [plan, expiresAt, nftsMinted, nftLimit, isActive] = 
        await subscription.getSubscription(artist.address);

      expect(plan).to.equal(2); // ELITE plan
      expect(nftLimit).to.equal(25); // 25 NFTs per month
      expect(isActive).to.be.true;
      expect(nftsMinted).to.equal(0);
    });

    it("Should transfer USDC to treasury on Elite plan subscription", async function () {
      const treasuryBalanceBefore = await mockUSDC.balanceOf(treasury.address);
      
      await mockUSDC.connect(artist).approve(
        await subscription.getAddress(), 
        ethers.parseUnits("9.99", 6)
      );

      await subscription.connect(artist).subscribeToElitePlan(false);

      const treasuryBalanceAfter = await mockUSDC.balanceOf(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(
        ethers.parseUnits("9.99", 6)
      );
    });

    it("Should allow Elite plan gasless subscription", async function () {
      await mockUSDC.connect(artist).approve(
        await subscription.getAddress(), 
        ethers.parseUnits("9.99", 6)
      );

      await subscription.connect(relayer).subscribeToElitePlanGasless(artist.address, false);

      const [plan, , , nftLimit, isActive] = 
        await subscription.getSubscription(artist.address);

      expect(plan).to.equal(2); // ELITE plan
      expect(nftLimit).to.equal(25);
      expect(isActive).to.be.true;
    });
  });

  describe("Plan Upgrades and Downgrades", function () {
    it("Should allow upgrading from Free to Master", async function () {
      // Start with Free plan
      await subscription.connect(user).subscribeToFreePlan();
      
      // Upgrade to Master
      await mockUSDC.connect(user).approve(
        await subscription.getAddress(), 
        ethers.parseUnits("4.99", 6)
      );
      await subscription.connect(user).subscribeToMasterPlan(false);

      const [plan, , , nftLimit] = await subscription.getSubscription(user.address);
      expect(plan).to.equal(1); // MASTER plan
      expect(nftLimit).to.equal(10);
    });

    it("Should allow upgrading from Master to Elite", async function () {
      // Start with Master plan
      await mockUSDC.connect(user).approve(
        await subscription.getAddress(), 
        ethers.parseUnits("4.99", 6)
      );
      await subscription.connect(user).subscribeToMasterPlan(false);
      
      // Upgrade to Elite
      await mockUSDC.connect(user).approve(
        await subscription.getAddress(), 
        ethers.parseUnits("9.99", 6)
      );
      await subscription.connect(user).subscribeToElitePlan(false);

      const [plan, , , nftLimit] = await subscription.getSubscription(user.address);
      expect(plan).to.equal(2); // ELITE plan
      expect(nftLimit).to.equal(25);
    });

    it("Should allow downgrading from Elite to Master", async function () {
      // Start with Elite plan
      await mockUSDC.connect(user).approve(
        await subscription.getAddress(), 
        ethers.parseUnits("9.99", 6)
      );
      await subscription.connect(user).subscribeToElitePlan(false);
      
      // Downgrade to Master
      await subscription.connect(user).downgradeSubscription(1);

      const [plan, , , nftLimit] = await subscription.getSubscription(user.address);
      expect(plan).to.equal(1); // MASTER plan
      expect(nftLimit).to.equal(10);
    });
  });

  describe("Collection Creation and NFT Minting", function () {
    beforeEach(async function () {
      // Subscribe artist to Elite plan for testing
      await mockUSDC.connect(artist).approve(
        await subscription.getAddress(), 
        ethers.parseUnits("9.99", 6)
      );
      await subscription.connect(artist).subscribeToElitePlan(false);
    });

    it("Should create collection successfully", async function () {
      const tx = await factory.connect(artist).createCollection(
        "Test Collection",
        "TEST",
        "A test collection",
        "https://example.com/image.png",
        "https://example.com",
        artist.address,
        500 // 5% royalty
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => 
        log.topics[0] === factory.interface.getEvent("CollectionCreated").topicHash
      );
      
      expect(event).to.not.be.undefined;
    });

    it("Should mint NFT successfully", async function () {
      // Create collection first
      const createTx = await factory.connect(artist).createCollection(
        "Test Collection",
        "TEST",
        "A test collection",
        "https://example.com/image.png",
        "https://example.com",
        artist.address,
        500
      );
      const createReceipt = await createTx.wait();
      
      // Get collection address from event
      const createEvent = createReceipt?.logs.find(log => 
        log.topics[0] === factory.interface.getEvent("CollectionCreated").topicHash
      );
      const collectionAddress = "0x" + createEvent?.topics[1].slice(26);

      // Mint NFT
      await factory.connect(artist).mintNFT(
        collectionAddress,
        user.address,
        "https://example.com/token1.json"
      );

      // Check NFT was minted
      const collection = await ethers.getContractAt("Art3HubCollectionV4", collectionAddress);
      expect(await collection.totalSupply()).to.equal(1);
      expect(await collection.ownerOf(1)).to.equal(user.address);
    });

    it("Should respect subscription limits", async function () {
      // Switch to Free plan (1 NFT limit)
      await subscription.connect(user).subscribeToFreePlan();
      
      // Create collection
      const createTx = await factory.connect(user).createCollection(
        "Limited Collection",
        "LTD",
        "A limited collection",
        "https://example.com/image.png",
        "https://example.com",
        user.address,
        500
      );
      const createReceipt = await createTx.wait();
      
      const createEvent = createReceipt?.logs.find(log => 
        log.topics[0] === factory.interface.getEvent("CollectionCreated").topicHash
      );
      const collectionAddress = "0x" + createEvent?.topics[1].slice(26);

      // First mint should succeed
      await factory.connect(user).mintNFT(
        collectionAddress,
        user.address,
        "https://example.com/token1.json"
      );

      // Second mint should fail
      await expect(
        factory.connect(user).mintNFT(
          collectionAddress,
          user.address,
          "https://example.com/token2.json"
        )
      ).to.be.revertedWith("Insufficient quota");
    });
  });

  describe("Factory View Functions", function () {
    beforeEach(async function () {
      await subscription.connect(artist).subscribeToFreePlan();
    });

    it("Should return user subscription info", async function () {
      const [planName, nftsMinted, nftLimit, isActive] = 
        await factory.getUserSubscriptionInfo(artist.address);
      
      expect(planName).to.equal("Free");
      expect(nftsMinted).to.equal(0);
      expect(nftLimit).to.equal(1);
      expect(isActive).to.be.true;
    });

    it("Should check if user can create collection", async function () {
      expect(await factory.canCreateCollection(artist.address)).to.be.true;
    });

    it("Should check if user can mint NFT", async function () {
      expect(await factory.canMintNFT(artist.address)).to.be.true;
    });
  });
});

// Mock ERC20 contract for testing
const MockERC20ABI = [
  "constructor(string memory name, string memory symbol, uint8 decimals)",
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];

const MockERC20Bytecode = "0x608060405234801561001057600080fd5b50604051610a93380380610a9383398101604081905261002f916101bb565b82516100429060039060208601906100c5565b5081516100569060049060208501906100c5565b506005805460ff191660ff929092169190911790555061024f915050565b82805461008190610214565b90600052602060002090601f0160209004810192826100a357600085556100e9565b82601f106100bc57805160ff19168380011785556100e9565b828001600101855582156100e9579182015b828111156100e95782518255916020019190600101906100ce565b506100f59291506100f9565b5090565b5b808211156100f557600081556001016100fa565b634e487b7160e01b600052604160045260246000fd5b600082601f83011261013557600080fd5b81516001600160401b038082111561014f5761014f61010e565b604051601f8301601f19908116603f011681019082821181831017156101775761017761010e565b8160405283815260209250868385880101111561019357600080fd5b600091505b838210156101b55785820183015181830184015290820190610198565b83821115610834576000838301525b50505092915050565b6000806000606084860312156101d057600080fd5b83516001600160401b03808211156101e757600080fd5b6101f387838801610124565b9450602086015191508082111561020957600080fd5b50610216868287016101238565b925050604084015160ff8116811461022d57600080fd5b809150509250925092565b600181811c9082168061024c57607f821691505b6020821081141561026d57634e487b7160e01b600052602260045260246000fd5b50919050565b6108350280620002846000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063313ce56711610066578063313ce567146100f457806340c10f191461010957806370a082311461011c57806395d89b411461014557806318160ddd1461014d57600080fd5b806306fdde0314610098578063095ea7b3146100b657806318160ddd146100d957806323b872dd146100e1575b600080fd5b6100a0610155565b6040516100ad91906106be565b60405180910390f35b6100c96100c4366004610728565b6101e7565b60405190151581526020016100ad565b6002545b6040519081526020016100ad565b6100c96100ef366004610752565b6101ff565b60055460405160ff90911681526020016100ad565b6100c9610117366004610728565b610223565b6100dd61012a36600461078e565b6001600160a01b031660009081526020819052604090205490565b6100a061023a565b6100dd610249565b606060038054610164906107a9565b80601f0160208091040260200160405190810160405280929190818152602001828054610190906107a9565b80156101dd5780601f106101b2576101008083540402835291602001916101dd565b820191906000526020600020905b8154815290600101906020018083116101c057829003601f168201915b5050505050905090565b6000336101f5818585610259565b5060019392505050565b60003361020d85828561037d565b6102188585856103f7565b506001949350505050565b60006102308383610596565b5060015b92915050565b606060048054610164906107a9565b60006002546102345b50919050565b6001600160a01b0383166102bb5760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b60648201526084015b60405180910390fd5b6001600160a01b03821661031c5760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b60648201526084016102b2565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b60006103898484610676565b90506000198114610391575b506001600160a01b0384166000908152600160209081526040808320338452909152902054828110156103e85760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e636500000060448201526064016102b2565b61039585338584036102b25b50505050565b6001600160a01b03831661045b5760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b60648201526084016102b2565b6001600160a01b0382166104bd5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b60648201526084016102b2565b6001600160a01b038316600090815260208190526040902054818110156105355760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b60648201526084016102b2565b6001600160a01b03848116600081815260208181526040808320878703905593871680835291849020805487019055925185815290927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a361039f565b6001600160a01b0382166105ec5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f20616464726573730060448201526064016102b2565b80600260008282546105fe91906107e4565b90915550506001600160a01b038216600081815260208181526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b6001600160a01b038281166000908152600160209081526040808320938516835292905205460001981146103915781811015610669574282826040517ffb8f41b20000000000000000000000000000000000000000000000000000000081526004016102b2939291906107fc565b6103918484848403610259565b6000602080835283518060208501526000905b818110156106ed578581018301518582016040015282016106d1565b818111156106ff576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b038116811461072357600080fd5b919050565b6000806040838503121561073b57600080fd5b6107448361070c565b946020939093013593505050565b60008060006060848603121561076757600080fd5b6107708461070c565b925061077e6020850161070c565b9150604084013590509250925092565b6000602082840312156107a057600080fd5b6102348261070c565b600181811c908216806107bd57607f821691505b6020821081141561025257634e487b7160e01b600052602260045260246000fd5b600082198211156107f757634e487b7160e01b600052601160045260246000fd5b500190565b6001600160a01b0393841681529190921660208201526040810191909152606001905600a2646970667358221220a3b0b0a1b0c0d0e0f10111213141516171819202122232425262728293031323334353637380a26469706673582212201234567890123456789012345678901234567890123456789012345678901234564736f6c63430008110033";