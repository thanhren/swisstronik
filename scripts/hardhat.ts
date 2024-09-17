import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Deployer:", owner.address);

  // Deploy the contract
  const contract = await hre.ethers.deployContract("Swisstronik", [
    // Constructor arguments if needed
  ]);

  await contract.waitForDeployment();

  const contractAddress = contract.target;
  console.log(
    `Swisstronik contract deployed to: ${contractAddress} <- copy that for "the deployed contract address"`
  );

  // Define the path for the "Task contract" folder
  const folderPath = path.join(__dirname, '../Task contract');

  // Ensure the folder exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Define the file path within the "Task contract" folder
  const filePath = path.join(folderPath, 'contracthardhat.txt');
  
  // Write the contract address to the file
  fs.writeFileSync(filePath, `|${contractAddress}`);

  console.log(`Contract address written to ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
