import { expect } from "chai";
import hre from "hardhat";

describe("Glamora Platform Tests", function () {
  let hub: any;
  let creatorProfile: any;
  let contentPayment: any;
  let owner: any;
  let creator1: any;
  let creator2: any;
  let user1: any;

  beforeEach(async function () {
    // Get test accounts
    [owner, creator1, creator2, user1] = await hre.ethers.getSigners();

    // Deploy GlamoraHub (deploys all contracts)
    const GlamoraHub = await hre.ethers.getContractFactory("GlamoraHub");
    hub = await GlamoraHub.deploy();
    await hub.waitForDeployment();

    // Get sub-contract addresses
    const [creatorProfileAddr, contentPaymentAddr] = await hub.getContractAddresses();

    // Get contract instances
    creatorProfile = await hre.ethers.getContractAt("CreatorProfile", creatorProfileAddr);
    contentPayment = await hre.ethers.getContractAt("ContentPayment", contentPaymentAddr);
  });

  describe("CreatorProfile Tests", function () {
    it("Should register a new creator", async function () {
      await hub.connect(creator1).registerCreator("Alice", "Fashion creator");

      const creator = await creatorProfile.getCreator(creator1.address);
      expect(creator.username).to.equal("Alice");
      expect(creator.bio).to.equal("Fashion creator");
      expect(creator.isActive).to.equal(true);
    });

    it("Should fail to register with empty username", async function () {
      await expect(
        hub.connect(creator1).registerCreator("", "Bio")
      ).to.be.revertedWith("Username cannot be empty");
    });

    it("Should not allow duplicate registration", async function () {
      await hub.connect(creator1).registerCreator("Alice", "Bio 1");

      await expect(
        hub.connect(creator1).registerCreator("Alice2", "Bio 2")
      ).to.be.revertedWith("Creator already registered");
    });

    it("Should update creator profile", async function () {
      await hub.connect(creator1).registerCreator("Alice", "Old bio");
      await creatorProfile.connect(creator1).updateCreator("Alice", "New bio");

      const creator = await creatorProfile.getCreator(creator1.address);
      expect(creator.bio).to.equal("New bio");
    });

    it("Should track total creators correctly", async function () {
      await hub.connect(creator1).registerCreator("Alice", "Bio 1");
      await hub.connect(creator2).registerCreator("Bob", "Bio 2");

      const total = await creatorProfile.totalCreators();
      expect(total).to.equal(2);
    });
  });

  describe("ContentPayment Tests", function () {
    beforeEach(async function () {
      // Register creator before creating content
      await hub.connect(creator1).registerCreator("Alice", "Content creator");
    });

    it("Should create content", async function () {
      const price = hre.ethers.parseEther("1.0"); // 1 DOT
      
      await hub.connect(creator1).createContent(
        "My First Tutorial",
        "QmHash123",
        price
      );

      const content = await contentPayment.getContent(1);
      expect(content.title).to.equal("My First Tutorial");
      expect(content.price).to.equal(price);
      expect(content.creator).to.equal(creator1.address);
    });

    it("Should fail to create content with empty title", async function () {
      const price = hre.ethers.parseEther("1.0");

      await expect(
        hub.connect(creator1).createContent("", "QmHash123", price)
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should fail to create content with zero price", async function () {
      await expect(
        hub.connect(creator1).createContent("Title", "QmHash123", 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should allow user to purchase content", async function () {
      const price = hre.ethers.parseEther("1.0");
      
      // Creator creates content
      await hub.connect(creator1).createContent(
        "Tutorial",
        "QmHash123",
        price
      );

      // Check creator balance before
      const balanceBefore = await hre.ethers.provider.getBalance(creator1.address);

      // User purchases content
      await hub.connect(user1).purchaseContent(1, { value: price });

      // Check creator balance after
      const balanceAfter = await hre.ethers.provider.getBalance(creator1.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);

      // Verify user has access
      const hasAccess = await contentPayment.hasAccess(user1.address, 1);
      expect(hasAccess).to.equal(true);
    });

    it("Should not allow purchasing same content twice", async function () {
      const price = hre.ethers.parseEther("1.0");
      
      await hub.connect(creator1).createContent("Tutorial", "QmHash123", price);
      await hub.connect(user1).purchaseContent(1, { value: price });

      await expect(
        hub.connect(user1).purchaseContent(1, { value: price })
      ).to.be.revertedWith("Already purchased");
    });

    it("Should not allow creator to buy their own content", async function () {
      const price = hre.ethers.parseEther("1.0");
      
      await hub.connect(creator1).createContent("Tutorial", "QmHash123", price);

      await expect(
        hub.connect(creator1).purchaseContent(1, { value: price })
      ).to.be.revertedWith("Creators cannot buy their own content");
    });

    it("Should update content price", async function () {
      const oldPrice = hre.ethers.parseEther("1.0");
      const newPrice = hre.ethers.parseEther("2.0");
      
      await hub.connect(creator1).createContent("Tutorial", "QmHash123", oldPrice);
      await contentPayment.connect(creator1).updateContentPrice(1, newPrice);

      const content = await contentPayment.getContent(1);
      expect(content.price).to.equal(newPrice);
    });

    it("Should track total revenue", async function () {
      const price1 = hre.ethers.parseEther("1.0");
      const price2 = hre.ethers.parseEther("2.0");
      
      // Creator creates two pieces of content
      await hub.connect(creator1).createContent("Tutorial 1", "QmHash1", price1);
      await hub.connect(creator1).createContent("Tutorial 2", "QmHash2", price2);

      // User purchases both
      await hub.connect(user1).purchaseContent(1, { value: price1 });
      await hub.connect(user1).purchaseContent(2, { value: price2 });

      const totalRevenue = await contentPayment.totalRevenue();
      expect(totalRevenue).to.equal(price1 + price2);
    });
  });

  describe("GlamoraHub Tests", function () {
    it("Should register and create content in one transaction", async function () {
      const price = hre.ethers.parseEther("1.0");

      const contentId = await hub.connect(creator1).registerAndCreateContent.staticCall(
        "Alice",
        "Content creator",
        "My Tutorial",
        "QmHash123",
        price
      );

      await hub.connect(creator1).registerAndCreateContent(
        "Alice",
        "Content creator",
        "My Tutorial",
        "QmHash123",
        price
      );

      // Verify creator registered
      expect(await creatorProfile.isCreator(creator1.address)).to.equal(true);

      // Verify content created
      const content = await contentPayment.getContent(contentId);
      expect(content.title).to.equal("My Tutorial");
    });

    it("Should return correct platform statistics", async function () {
      const price = hre.ethers.parseEther("1.0");

      // Register creators and create content
      await hub.connect(creator1).registerAndCreateContent(
        "Alice",
        "Bio",
        "Tutorial 1",
        "Hash1",
        price
      );
      await hub.connect(creator2).registerAndCreateContent(
        "Bob",
        "Bio",
        "Tutorial 2",
        "Hash2",
        price
      );

      // User purchases content
      await hub.connect(user1).purchaseContent(1, { value: price });

      const [totalCreators, totalContent, totalRevenue] = await hub.getPlatformStats();
      
      expect(totalCreators).to.equal(2);
      expect(totalContent).to.equal(2);
      expect(totalRevenue).to.equal(price);
    });

    it("Should return contract addresses", async function () {
      const [creatorAddr, contentAddr] = await hub.getContractAddresses();
      
      expect(creatorAddr).to.equal(await creatorProfile.getAddress());
      expect(contentAddr).to.equal(await contentPayment.getAddress());
    });
  });
});
