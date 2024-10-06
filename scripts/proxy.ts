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
  console.log(`👉 Contract address 1 deployed to: ${swisstronik.target} 👈 Copy Contract address 1`);

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
    `Proxy contract address: ${proxy.target} `
  );

  // Define file paths within the "Task contract" folder
  const proxyaddress1Path = path.join(folderPath, 'contractproxyaddress1.txt');
  const contractproxy = path.join(folderPath, 'contractproxy.txt');
  const proxyaddress2Path = path.join(folderPath, 'contractproxyaddress2.txt');
  const upgradeTxFilePath = path.join(folderPath, 'contractproxytx.txt');
  

  // Write the proxy contract address to contractproxyaddress1.txt
  fs.writeFileSync(proxyaddress1Path, `|${swisstronik.target}`);
  console.log(`Proxy contract address written to ${proxyaddress1Path}`);

  // Write the upgrade transaction hash to contractproxy.txt
  fs.writeFileSync(contractproxy, `|${proxy.target}`);
  console.log(`Proxy contract address written to Contactproxy.txt `);

  // Deploy the second contract
  const Swisstronik2 = await ethers.getContractFactory("Swisstronik2");
  const swisstronik2 = await Swisstronik2.deploy();
  await swisstronik2.waitForDeployment();
  console.log(`Contract address 2 deployed to: ${swisstronik2.target}`);

  // Write the proxy contract address to contractproxyaddress2.txt
  fs.writeFileSync(proxyaddress2Path, `|${swisstronik2.target}`);
  console.log(`Proxy contract address written to ${proxyaddress2Path}`);

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
    `👉 Response: https://explorer-evm.testnet.swisstronik.com/tx/${upgrade.hash} 👈 Copy transaction upgrade`
  );

  // Write the upgrade transaction hash to contractproxytx.txt
  fs.writeFileSync(upgradeTxFilePath, `|https://explorer-evm.testnet.swisstronik.com/tx/${upgrade.hash}`);
  console.log(`Upgrade transaction hash written to ${upgradeTxFilePath}`);
  console.log(`Sucessfully!!! `);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
