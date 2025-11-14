// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CreatorProfile
 * @dev Stores creator information like username and bio
 * Think of this as a database of all creators on Glamora
 */
contract CreatorProfile {
    
    // This struct holds all info about one creator
    struct Creator {
        string username;      // their display name
        string bio;          // their description
        address wallet;      // their blockchain address
        uint256 createdAt;   // when they joined (timestamp)
        bool isActive;       // true if registered, false if not
    }
    
    // This maps wallet addresses to their creator info
    // Example: creators[0x123...] = Creator{username: "Alice", ...}
    mapping(address => Creator) public creators;
    
    // Keeps count of how many creators exist
    uint256 public totalCreators;
    
    // These events get logged on the blockchain when things happen
    event CreatorRegistered(
        address indexed wallet,
        string username,
        uint256 timestamp
    );
    
    event CreatorUpdated(
        address indexed wallet,
        string username,
        uint256 timestamp
    );
    
    /**
     * @dev Sign up as a new creator
     * @param _creator The wallet address of the person registering
     * @param _username Their chosen username
     * @param _bio Their profile description
     * 
     * NOTE: We pass _creator as a parameter so GlamoraHub can register users properly
     */
    function registerCreator(
        address _creator,
        string memory _username,
        string memory _bio
    ) public {
        // Check that username is not empty
        require(bytes(_username).length > 0, "Username cannot be empty");
        
        // Check username is not too long (max 50 characters)
        require(bytes(_username).length <= 50, "Username too long");
        
        // Check bio is not too long (max 500 characters)
        require(bytes(_bio).length <= 500, "Bio too long");
        
        // Make sure this person hasn't already registered
        require(!creators[_creator].isActive, "Creator already registered");
        
        // Save the creator's info
        creators[_creator] = Creator({
            username: _username,
            bio: _bio,
            wallet: _creator,
            createdAt: block.timestamp,  // current time
            isActive: true
        });
        
        // Increase the total count
        totalCreators++;
        
        // Log this registration on the blockchain
        emit CreatorRegistered(_creator, _username, block.timestamp);
    }
    
    /**
     * @dev Change your username or bio after registering
     * @param _username Your new username
     * @param _bio Your new bio
     */
    function updateCreator(
        string memory _username,
        string memory _bio
    ) public {
        // Make sure you're already registered
        require(creators[msg.sender].isActive, "Creator not registered");
        
        // Same validation checks as registration
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(bytes(_username).length <= 50, "Username too long");
        require(bytes(_bio).length <= 500, "Bio too long");
        
        // Update the stored information
        creators[msg.sender].username = _username;
        creators[msg.sender].bio = _bio;
        
        // Log this update
        emit CreatorUpdated(msg.sender, _username, block.timestamp);
    }
    
    /**
     * @dev Look up a creator's profile by their wallet address
     * @param _wallet The address to look up
     * @return The creator's full profile information
     */
    function getCreator(address _wallet) 
        public 
        view 
        returns (Creator memory) 
    {
        // Make sure this creator exists
        require(creators[_wallet].isActive, "Creator not found");
        return creators[_wallet];
    }
    
    /**
     * @dev Check if someone is a registered creator
     * @param _wallet The address to check
     * @return true if they're registered, false if not
     */
    function isCreator(address _wallet) public view returns (bool) {
        return creators[_wallet].isActive;
    }
}