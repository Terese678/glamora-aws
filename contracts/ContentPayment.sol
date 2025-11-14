// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ContentPayment
 * @dev Handles buying and selling content on Glamora
 * creators upload content, users pay to unlock it
 */
contract ContentPayment {
    
    // this struct holds all info about one piece of content
    struct Content {
        uint256 contentId;      // unique ID number
        address creator;        // who created it
        string title;          // what it's called
        string contentHash;    // where it's stored (IPFS hash)
        uint256 price;         // cost in wei (smallest unit of crypto)
        uint256 createdAt;     // when it was uploaded (timestamp)
        bool isActive;         // true if available, false if deleted
    }
    
    // This maps content IDs to their info
    // example, contents[1] = Content{title: "My Tutorial", price: 1000000...}
    mapping(uint256 => Content) public contents;
    
    // This tracks who has bought what
    // example: userAccess[0xABC...][1] = true means address 0xABC bought content #1
    mapping(address => mapping(uint256 => bool)) public userAccess;
    
    // This lists all content IDs created by each creator
    // example: creatorContents[0x123...] = [1, 5, 9] means they created content 1, 5, and 9
    mapping(address => uint256[]) public creatorContents;
    
    // Counter for assigning content IDs (starts at 1)
    uint256 public nextContentId = 1;
    
    // Running total of all money spent on content
    uint256 public totalRevenue;
    
    // Events are notifications saved on the blockchain
    event ContentCreated(
        uint256 indexed contentId,
        address indexed creator,
        string title,
        uint256 price
    );
    
    event ContentPurchased(
        uint256 indexed contentId,
        address indexed buyer,
        address indexed creator,
        uint256 price
    );
    
    event ContentUpdated(
        uint256 indexed contentId,
        uint256 newPrice
    );
    
    /**
     * @dev Upload new content for sale
     * @param _creator Who is creating this content (passed from GlamoraHub)
     * @param _title Name of the content
     * @param _contentHash IPFS hash or link to the actual content
     * @param _price How much to charge in wei
     * @return The ID number assigned to this content
     */
    function createContent(
        address _creator,
        string memory _title,
        string memory _contentHash,
        uint256 _price
    ) public returns (uint256) {
        // Check title is not empty
        require(bytes(_title).length > 0, "Title cannot be empty");
        
        // Check content hash is not empty
        require(bytes(_contentHash).length > 0, "Content hash cannot be empty");
        
        // Check price is more than zero
        require(_price > 0, "Price must be greater than 0");
        
        // Get the next available ID
        uint256 contentId = nextContentId;
        
        // Save all the content info
        contents[contentId] = Content({
            contentId: contentId,
            creator: _creator,
            title: _title,
            contentHash: _contentHash,
            price: _price,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Add this content ID to the creator's list
        creatorContents[_creator].push(contentId);
        
        // Increment counter for next content
        nextContentId++;
        
        // Log this creation
        emit ContentCreated(contentId, _creator, _title, _price);
        
        return contentId;
    }
    
    /**
     * @dev Buy access to a piece of content
     * @param _buyer Who is buying this content (passed from GlamoraHub)
     * @param _contentId The ID of the content to buy
     * 
     * you must send enough crypto with this transaction to cover the price
     */
    function purchaseContent(address _buyer, uint256 _contentId) public payable {
        // Load the content info
        Content memory content = contents[_contentId];
        
        // Make sure the content exists and is active
        require(content.isActive, "Content not found or inactive");
        
        // Make sure enough money was sent
        require(msg.value >= content.price, "Insufficient payment");
        
        // Make sure buyer hasn't already bought this
        require(!userAccess[_buyer][_contentId], "Already purchased");
        
        // Make sure creator can't buy their own content
        require(_buyer != content.creator, "Creators cannot buy their own content");
        
        // Grant buyer access to this content
        userAccess[_buyer][_contentId] = true;
        
        // Send the money to the creator
        payable(content.creator).transfer(content.price);
        
        // Add to total revenue counter
        totalRevenue += content.price;
        
        // If too much money was sent, send the extra back to the buyer
        if (msg.value > content.price) {
            payable(_buyer).transfer(msg.value - content.price);
        }
        
        // Log this purchase
        emit ContentPurchased(_contentId, _buyer, content.creator, content.price);
    }
    
    /**
     * @dev Change the price of your content
     * @param _contentId Which content to update
     * @param _newPrice The new price in wei
     * 
     * Only the creator can do this
     */
    function updateContentPrice(uint256 _contentId, uint256 _newPrice) public {
        // Load the content info (use storage so we can modify it)
        Content storage content = contents[_contentId];
        
        // Make sure content exists
        require(content.isActive, "Content not found");
        
        // Make sure you're the creator
        require(content.creator == msg.sender, "Only creator can update");
        
        // Make sure new price is not zero
        require(_newPrice > 0, "Price must be greater than 0");
        
        // Update the price
        content.price = _newPrice;
        
        // Log this update
        emit ContentUpdated(_contentId, _newPrice);
    }
    
    /**
     * @dev Check if someone has access to content
     * @param _user The wallet address to check
     * @param _contentId The content ID to check
     * @return true if they have access, false if not
     * 
     * Creators always have access to their own content
     */
    function hasAccess(address _user, uint256 _contentId) public view returns (bool) {
        // If you're the creator, you always have access
        if (contents[_contentId].creator == _user) {
            return true;
        }
        // Otherwise check if you bought it
        return userAccess[_user][_contentId];
    }
    
    /**
     * @dev Look up content details
     * @param _contentId The content ID to look up
     * @return All the information about this content
     */
    function getContent(uint256 _contentId) public view returns (Content memory) {
        require(contents[_contentId].isActive, "Content not found");
        return contents[_contentId];
    }
    
    /**
     * @dev Get all content created by someone
     * @param _creator The creator's wallet address
     * @return Array of content IDs they created
     */
    function getCreatorContent(address _creator) public view returns (uint256[] memory) {
        return creatorContents[_creator];
    }
    
    /**
     * @dev Delete content (soft delete - just marks it inactive)
     * @param _contentId The content to delete
     * 
     * Only the creator can do this
     */
    function deactivateContent(uint256 _contentId) public {
        Content storage content = contents[_contentId];
        
        // Make sure content exists
        require(content.isActive, "Content not found");
        
        // Make sure you're the creator
        require(content.creator == msg.sender, "Only creator can deactivate");
        
        // Mark as inactive
        content.isActive = false;
    }
}