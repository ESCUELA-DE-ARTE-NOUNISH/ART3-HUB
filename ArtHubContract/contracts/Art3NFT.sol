// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/// @title ART3 Hub NFT Collection - Open Minting with Royalties on Base
contract Art3NFT is ERC721URIStorage, IERC2981, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint96 private constant ROYALTY_BASIS_POINTS = 1000; // 10%
    address private _royaltyRecipient;

    constructor() ERC721("ART3 Hub Collection", "ART3") {
        _royaltyRecipient = msg.sender;
    }

    /// @notice Mint a new NFT with a token URI
    function mint(string memory tokenURI) external returns (uint256) {
        _tokenIds.increment();
        uint256 newId = _tokenIds.current();
        _mint(msg.sender, newId);
        _setTokenURI(newId, tokenURI);
        return newId;
    }

    /// @notice Set new royalty recipient
    function setRoyaltyRecipient(address newRecipient) external onlyOwner {
        _royaltyRecipient = newRecipient;
    }

    /// @notice EIP-2981 royalty info
    function royaltyInfo(uint256, uint256 salePrice) external view override returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * ROYALTY_BASIS_POINTS) / 10000;
        return (_royaltyRecipient, royaltyAmount);
    }

    /// @dev Support for ERC165 interfaces
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}