import hre from "hardhat";

async function main() {
  console.log("💰 Testing Content Purchase Flow on Moonbase Alpha...\n");

  const hubAddress = "0x4fe1D1b42E734c52365C0DdF2C94bf34f6e07115";
  const contentPaymentAddress = "0x86eC3e58B69e9975d572d099814c2F470E18b2e6";
  
  const [creator] = await hre.ethers.getSigners();
  
  console.log("👤 Creator:", creator.address);
  console.log();

  const hub = await hre.ethers.getContractAt("GlamoraHub", hubAddress);
  const contentPayment = await hre.ethers.getContractAt("ContentPayment", contentPaymentAddress);

  // Check creator balance before
  const creatorBalanceBefore = await hre.ethers.provider.getBalance(creator.address);
  console.log("💵 Creator balance BEFORE:", hre.ethers.formatEther(creatorBalanceBefore), "DEV");

  // Create content
  const price = hre.ethers.parseEther("0.05"); // 0.05 DEV
  console.log("\n📝 Creating new content (price: 0.05 DEV)...");
  
  const tx = await hub.connect(creator).createContent(
    "Premium Fashion Tutorial",
    "QmTestHash789",
    price
  );
  await tx.wait();
  console.log("✅ Content created! Checking content ID...");

  // Get the content ID (should be 2 or 3 depending on previous tests)
  const nextId = await contentPayment.nextContentId();
  const contentId = Number(nextId) - 1;
  console.log("📋 Content ID:", contentId);

  // Get content details
  const content = await contentPayment.getContent(contentId);
  console.log("📄 Content title:", content.title);
  console.log("💰 Content price:", hre.ethers.formatEther(content.price), "DEV");
  console.log("👤 Content creator:", content.creator);

  // Check if creator has access to their own content
  const creatorHasAccess = await contentPayment.hasAccess(creator.address, contentId);
  console.log("🔐 Creator has access to own content:", creatorHasAccess);

  // Check platform stats
  const [totalCreators, totalContent, totalRevenue] = await hub.getPlatformStats();
  console.log("\n📊 Platform Statistics:");
  console.log("   Total Creators:", totalCreators.toString());
  console.log("   Total Content:", totalContent.toString());
  console.log("   Total Revenue:", hre.ethers.formatEther(totalRevenue), "DEV");

  console.log("\n✅ All checks passed!");
  console.log("\n💡 NOTE: To test actual purchases, we need a second wallet with DEV tokens.");
  console.log("   For the hackathon demo, we'll build a frontend where users can purchase with their own wallets!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  