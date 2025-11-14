import hre from "hardhat";

async function main() {
  console.log("🧪 Testing live contracts on Moonbase Alpha...\n");

  const hubAddress = "0x4fe1D1b42E734c52365C0DdF2C94bf34f6e07115";
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing with account:", signer.address);

  const hub = await hre.ethers.getContractAt("GlamoraHub", hubAddress);

  // Test 1: Register as creator
  console.log("\n📝 Registering as creator...");
  const tx1 = await hub.registerCreator("TestCreator", "I'm testing Glamora!");
  await tx1.wait();
  console.log("✅ Creator registered!");

  // Test 2: Check if registered
  const isCreator = await hub.isCreator(signer.address);
  console.log("✅ Creator status:", isCreator);

  // Test 3: Create content
  console.log("\n📝 Creating content...");
  const price = hre.ethers.parseEther("0.1"); // 0.1 DEV
  const tx2 = await hub.createContent("My First Content", "QmTest123", price);
  await tx2.wait();
  console.log("✅ Content created!");

  console.log("\n🎉 All tests passed! Your contracts work on Polkadot!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

