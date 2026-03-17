const hre = require("hardhat");

async function main() {
    const VeriTrust = await hre.ethers.getContractFactory("VeriTrust");
    const veritrust = await VeriTrust.deploy();

    await veritrust.waitForDeployment();

    console.log(
        `VeriTrust deployed to ${await veritrust.getAddress()}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
