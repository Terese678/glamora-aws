import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying Glamora to Moonbase Alpha (Polkadot Testnet)...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "DEV\n");

  console.log("📝 Deploying GlamoraHub...");
  const GlamoraHub = await hre.ethers.getContractFactory("GlamoraHub");
  const hub = await GlamoraHub.deploy();
  await hub.waitForDeployment();

  const hubAddress = await hub.getAddress();
  console.log("✅ GlamoraHub deployed to:", hubAddress);

  const [creatorProfileAddr, contentPaymentAddr] = await hub.getContractAddresses();
  console.log("✅ CreatorProfile deployed to:", creatorProfileAddr);
  console.log("✅ ContentPayment deployed to:", contentPaymentAddr);

  console.log("\n📋 SAVE THESE ADDRESSES:\n");
  console.log("GlamoraHub:", hubAddress);
  console.log("CreatorProfile:", creatorProfileAddr);
  console.log("ContentPayment:", contentPaymentAddr);

  console.log("\n🔍 View on Moonbase Explorer:");
  console.log(`https://moonbase.moonscan.io/address/${hubAddress}`);

  console.log("\n✅ Deployment complete! Your contracts are live on Polkadot! 🎉");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
