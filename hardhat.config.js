require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-web3');
require("hardhat-gas-reporter");
require('hardhat-contract-sizer');
require("solidity-coverage");
require('hardhat-spdx-license-identifier');
require('hardhat-abi-exporter');
require('hardhat-storage-layout');
require('@openzeppelin/hardhat-upgrades');
const fs = require("fs");

module.exports = {
    solidity: {
        compilers: [
            {
                version: '0.8.15',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100
                    }
                }
            },
            {
                version: '0.8.10',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100
                    }
                }
            },
            {
                version: '0.7.6',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100
                    }
                }
            },{
                version: '0.8.2',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100
                    }
                }
            }
        ]
    },

    networks: {
        hardhat: 
        {
            accounts: {
                accountsBalance: "100000000000000000000000000",
              },
        },
        ethereum: {
            url: process.env.ETHEREUM_URL,
            chainId: 1,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_ETH) || 'auto'
        },
        ethereumTestnet: {
            url: process.env.GOERLI_URL,
            chainId: 5,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_ETH) || 'auto'
        },
        polygon: {
            url: process.env.POLYGON_URL,
            chainId: 137,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_POL) || 'auto'
        },
        polygonTestnet: {
            url: process.env.MUMBAI_URL,
            chainId: 80001,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_POL) || 'auto'
        },
        arbitrum: {
            url: process.env.ARBITRUM_URL,
            chainId: 42161,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_ARB) || 'auto'
        },
        arbitrumTestnet: {
            url: process.env.ARBITRUMGOERLI_URL,
            chainId: 421613,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_ARB) || 'auto'
        },
        optimism: {
            url: process.env.OPTIMISM_URL,
            chainId: 10,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_OPT) || 'auto'
        },
        optimismTestnet: {
            url: process.env.OPTIMISMGOERLI_URL,
            chainId: 420,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_OPT) || 'auto'
        },
        zkevm: {
            url: process.env.ZKEVM_URL,
            chainId: 1101,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_ZKE) || 'auto'
        },
        zkevmTestnet: {
            url: process.env.ZKEVMTESTNET_URL,
            chainId: 1442,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_ZKE) || 'auto'
        },
        bsc: {
            url: process.env.BSC_URL,
            chainId: 56,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_BSC) || 'auto'
        },
        bscTestnet: {
            url: process.env.BSCTESTNET_URL,
            chainId: 97,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_BSC) || 'auto'
        },
        mantle: {
            url: process.env.MANTLE_URL,
            chainId: 5000,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_MNT) || 'auto'
        },
        mantleTestnet: {
            url: process.env.MANTLETESTNET_URL,
            chainId: 5001,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_MNT) || 'auto'
        },
        mode: {
            url: process.env.MODE_URL,
            chainId: 34443,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_MOD) || 'auto'
        },
        modeTestnet: {
            url: process.env.MODETESTNET_URL,
            chainId: 919,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_MOD) || 'auto'
        },
        base: {
            url: process.env.BASE_URL,
            chainId: 8453,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_BAS) || 'auto'
        },
        baseTestnet: {
            url: process.env.BASETESTNET_URL,
            chainId: 84532,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_BAS) || 'auto'
        }
    },

    etherscan: {
        apiKey: process.env.SCAN_API_KEY,
        customChains: [
            {
              network: "zkevmTestnet",
              chainId: 1442,
              urls: {
                apiURL: "https://api-testnet-zkevm.polygonscan.com/api",
                browserURL: "https://testnet-zkevm.polygonscan.com/"
              }
            }
          ]
    },

    mocha: {
        grep: '^(?!.*; using Ganache).*'
    },

    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
    },

    gasReporter: {
        enabled: process.env.REPORT_GAS ? true : false,
        currency: 'USD',
    },
};