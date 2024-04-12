require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" })

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  // networks: {
  //   sepolia: {
  //     url: process.env.SEPOLIA_URL,
  //     accounts: [process.env.PRIVKEY_ADMIN, process.env.PRIVKEY_BRAND, process.env.PRIVKEY_BUYER, process.env.PRIVKEY_CHIP, process.env.PRIVKEY_BUYER2],
  //     chainId: 11155111
  //   },

  //   scrollSepolia: {
  //     url: "https://sepolia-rpc.scroll.io/",
  //     accounts: [process.env.PRIVKEY_ADMIN, process.env.PRIVKEY_BRAND, process.env.PRIVKEY_BUYER, process.env.PRIVKEY_CHIP, process.env.PRIVKEY_BUYER2],
  //     chainId: 534351
  //   },
  // }
};
