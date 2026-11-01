const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("--------------------------------------------------");
  console.log("Deploying NonceWatchRegistry to BOT Chain Testnet...");
  console.log("Network:", hre.network.name);
  console.log("--------------------------------------------------");

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account found! Please make sure PRIVATE_KEY is set in your .env file.");
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Address:", deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(balance), "BOT");

  const NonceWatchRegistry = await hre.ethers.getContractFactory("NonceWatchRegistry");
  const registry = await NonceWatchRegistry.deploy();
  await registry.waitForDeployment();

  const deployedAddress = await registry.getAddress();
  console.log("==================================================");
  console.log("NonceWatchRegistry deployed successfully to:", deployedAddress);
  console.log("==================================================");

  // Write deployment info for frontend
  const deploymentInfo = {
    address: deployedAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 968,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  const contractsDir = path.join(__dirname, "../src/contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(contractsDir, "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Also extract ABI
  const artifact = await hre.artifacts.readArtifact("NonceWatchRegistry");
  fs.writeFileSync(
    path.join(contractsDir, "NonceWatchRegistry.json"),
    JSON.stringify(artifact, null, 2)
  );

  console.log("Saved ABI and deployment info to src/contracts/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

