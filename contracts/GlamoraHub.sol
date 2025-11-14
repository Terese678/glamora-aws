// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CreatorProfile.sol";
import "./ContentPayment.sol";

/**
 * @title GlamoraHub
 * @dev The main control center for Glamora
 * This contract brings together creator profiles and content payments
 * Users interact with this contract instead of calling each sub-contract directly
 */
contract GlamoraHub {
    
    // References to the two other contracts
    CreatorProfile public creatorProfile;
    ContentPayment public contentPayment;
    
    // The person who deployed this contract
    address public owner;
    
    // Platform fee in basis points (100 = 1%, 1000 = 10%)
    uint256 public platformFee;
    
    // Events are like notifications that get saved on the blockchain
    event PlatformInitialized(
        address creatorProfileAddress,
        address contentPaymentAddress
    );
    
    event CreatorRegisteredAndContentCreated(
        address indexed creator,
        uint256 indexed contentId
    );
    
    /**
     * @dev Constructor runs when contract is deployed
     * It automatically creates the CreatorProfile and ContentPayment contracts
     */
    constructor() {
        owner = msg.sender;
        platformFee = 0; // Start with 0% fee - creators keep 100%
        
        // Create the two sub-contracts
        creatorProfile = new CreatorProfile();
        contentPayment = new ContentPayment();
        
        // Log the addresses of the new contracts
        emit PlatformInitialized(
            address(creatorProfile),
            address(contentPayment)
        );
    }
    
    /**
     * @dev Register yourself as a creator
     * @param username Your display name
     * @param bio Your profile description
     * 
     * This is easier than calling CreatorProfile directly
     */
    function registerCreator(string memory username, string memory bio) public {
        // Pass msg.sender so the profile knows who's registering
        creatorProfile.registerCreator(msg.sender, username, bio);
    }
    
    /**
     * @dev Upload new content for sale
     * @param title Name of your content
     * @param contentHash IPFS hash where content is stored
     * @param price How much to charge (in wei - smallest unit of crypto)
     * @return contentId The ID number of your new content
     * 
     * Only registered creators can do this
     */
    function createContent(
        string memory title,
        string memory contentHash,
        uint256 price
    ) public returns (uint256) {
        // Check that the person is a registered creator
        require(creatorProfile.isCreator(msg.sender), "Must be registered creator");
        
        // Create the content and return its ID
        return contentPayment.createContent(msg.sender, title, contentHash, price);
    }
    
    /**
     * @dev Register AND create content in one transaction
     * @param username Your display name
     * @param bio Your profile description  
     * @param title Name of your content
     * @param contentHash IPFS hash where content is stored
     * @param price How much to charge (in wei)
     * @return contentId The ID number of your new content
     * 
     * This saves gas by doing both steps at once
     * If you're already registered, it just creates the content
     */
    function registerAndCreateContent(
        string memory username,
        string memory bio,
        string memory title,
        string memory contentHash,
        uint256 price
    ) public returns (uint256) {
        // Only register if not already a creator
        if (!creatorProfile.isCreator(msg.sender)) {
            creatorProfile.registerCreator(msg.sender, username, bio);
        }
        
        // Create the content
        uint256 contentId = contentPayment.createContent(msg.sender, title, contentHash, price);
        
        // Log this combined action
        emit CreatorRegisteredAndContentCreated(msg.sender, contentId);
        
        return contentId;
    }
    
    /**
     * @dev Buy access to a piece of content
     * @param contentId The ID of the content you want to buy
     * 
     * You must send enough crypto to cover the price
     * The payment goes directly to the creator
     */
    function purchaseContent(uint256 contentId) public payable {
        // Forward the payment to ContentPayment, passing the actual buyer's address
        contentPayment.purchaseContent{value: msg.value}(msg.sender, contentId);
    }
    
    /**
     * @dev Get overall platform numbers
     * @return totalCreators How many creators have registered
     * @return totalContent How many pieces of content exist
     * @return totalRevenue How much money has been spent on content
     */
    function getPlatformStats() public view returns (
        uint256 totalCreators,
        uint256 totalContent,
        uint256 totalRevenue
    ) {
        totalCreators = creatorProfile.totalCreators();
        totalContent = contentPayment.nextContentId() - 1;
        totalRevenue = contentPayment.totalRevenue();
    }
    
    /**
     * @dev Get the addresses of the sub-contracts
     * @return creatorProfileAddr Where the CreatorProfile contract lives
     * @return contentPaymentAddr Where the ContentPayment contract lives
     * 
     * Useful if you want to interact with them directly
     */
    function getContractAddresses() public view returns (
        address creatorProfileAddr,
        address contentPaymentAddr
    ) {
        creatorProfileAddr = address(creatorProfile);
        contentPaymentAddr = address(contentPayment);
    }
    
    /**
     * @dev Check if someone is a registered creator
     * @param user The wallet address to check
     * @return true if they're a creator, false if not
     */
    function isCreator(address user) public view returns (bool) {
        return creatorProfile.isCreator(user);
    }
    
    /**
     * @dev Check if someone has bought a piece of content
     * @param user The wallet address to check
     * @param contentId The content ID to check
     * @return true if they have access, false if not
     */
    function hasAccessToContent(address user, uint256 contentId) public view returns (bool) {
        return contentPayment.hasAccess(user, contentId);
    }
    
    /**
     * @dev Change the platform fee (only the owner can do this)
     * @param _newFee The new fee in basis points (100 = 1%)
     * 
     * Maximum allowed fee is 10% (1000 basis points)
     */
    function updatePlatformFee(uint256 _newFee) public {
        require(msg.sender == owner, "Only owner can update fee");
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        
        platformFee = _newFee;
    }
}
