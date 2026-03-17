require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.19",
    networks: {
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR-PROJECT-ID",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        localhost: {
            url: "http://127.0.0.1:8545"
        }
    }
};
