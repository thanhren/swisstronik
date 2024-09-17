import "@openzeppelin/hardhat-upgrades";
import { ethers, upgrades } from "hardhat";
import { sendShieldedTransaction } from "../utils/swisstronik";
import fs from "fs";
import path from "path";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Deployer:", owner.address);

  // Define the path to the "Task contract" folder
  const folderPath = path.join(__dirname, '../Task contract');

  // Ensure the folder exists, create if it doesn't
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Deploy the first contract
  const Swisstronik = await ethers.getContractFactory("Swisstronik");
  const swisstronik = await Swisstronik.deploy();
  await swisstronik.waitForDeployment();
  console.log("Contract address 1 deployed to:", swisstronik.target);

  // Deploy the proxy admin
  const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
  const proxyAdmin = await ProxyAdmin.deploy(owner.address);
  await proxyAdmin.waitForDeployment();
  console.log("ProxyAdmin address deployed to:", proxyAdmin.target);

  // Deploy the proxy
  const TransparentUpgradeableProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
  const proxy = await TransparentUpgradeableProxy.deploy(
    swisstronik.target,
    proxyAdmin.target,
    Uint8Array.from([])
  );
  await proxy.waitForDeployment();
  console.log(
    `Proxy contract address: ${proxy.target} <- copy that for "the deployed proxy contract address"`
  );

  // Define file paths within the "Task contract" folder
  const proxyFilePath = path.join(folderPath, 'contractproxy.txt');
  const upgradeTxFilePath = path.join(folderPath, 'contractproxytx.txt');
  const Address = path.join(folderPath, 'VerifyAddress.txt');

  // Write the proxy contract address to contractproxy.txt
  fs.writeFileSync(proxyFilePath, `|${proxy.target}`);
  console.log(`Proxy contract address written to ${proxyFilePath}`);

  // Deploy the second contract
  const Swisstronik2 = await ethers.getContractFactory("Swisstronik2");
  const swisstronik2 = await Swisstronik2.deploy();
  await swisstronik2.waitForDeployment();
  console.log(`Contract address 2 deployed to: ${swisstronik2.target}`);

  // Perform the upgrade
  const upgrade = await sendShieldedTransaction(
    owner,
    proxyAdmin.target,
    proxyAdmin.interface.encodeFunctionData("upgradeAndCall", [
      proxy.target,
      swisstronik2.target,
      Uint8Array.from([]),
    ]),
    0
  );
  await upgrade.wait();

  console.log(
    `Response: https://explorer-evm.testnet.swisstronik.com/tx/${upgrade.hash} <- copy that for "the link to the contract implementation replacement transaction"`
  );

  // Write the upgrade transaction hash to contractproxytx.txt
  fs.writeFileSync(upgradeTxFilePath, `|https://explorer-evm.testnet.swisstronik.com/tx/${upgrade.hash}`);
  console.log(`Upgrade transaction hash written to ${upgradeTxFilePath}`);

// Write the upgrade transaction hash to contractproxytx.txt
  fs.writeFileSync(Address, swisstronik.target);
  console.log(`Done!`);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
