import { expect } from "chai";
import { ethers } from "hardhat";

describe("Art3NFT", function () {
  it("should mint an NFT with correct URI", async () => {
    const [deployer, user] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("Art3NFT");
    const contract = await factory.deploy();
    await contract.deployed();

    const tx = await contract.connect(user).mint("ipfs://example-uri");
    const receipt = await tx.wait();
    const tokenId = receipt.events?.[0].args?.tokenId;

    expect(await contract.ownerOf(tokenId)).to.equal(user.address);
    expect(await contract.tokenURI(tokenId)).to.equal("ipfs://example-uri");
  });

  it("should return royalty info", async () => {
    const factory = await ethers.getContractFactory("Art3NFT");
    const contract = await factory.deploy();
    await contract.deployed();

    const [recipient, royalty] = await contract.royaltyInfo(1, 10000);
    expect(royalty).to.equal(1000); // 10%
  });
});
