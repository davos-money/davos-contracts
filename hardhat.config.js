require("dotenv").config();
// require("@nomiclabs/hardhat-etherscan");
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
require("@nomicfoundation/hardhat-verify");

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
            chainId: 17000,
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
            chainId: 421614,
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
            chainId: 11155420,
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
        linea: {
            url: process.env.LINEA_URL,
            chainId: 59144,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_LIN) || 'auto'
        },
        lineaTestnet: {
            url: process.env.LINEATESTNET_URL,
            chainId: 59141,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_LIN) || 'auto'
        },
        mantle: {
            url: process.env.MANTLE_URL,
            chainId: 5000,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_MNT) || 'auto'
        },
        mantleTestnet: {
            url: process.env.MANTLETESTNET_URL,
            chainId: 5003,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_MNT) || 'auto'
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
        },
        xLayer: {
            url: process.env.XLAYER_URL,
            chainId: 196,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_XLA) || 'auto'
        },
        xLayerTestnet: {
            url: process.env.XLAYERTESTNET_URL,
            chainId: 195,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_XLA) || 'auto'
        },
        blast: {
            url: process.env.BLAST_URL,
            chainId: 81457,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_BLA) || 'auto'
        },
        blastTestnet: {
            url: process.env.BLASTTESTNET_URL,
            chainId: 168587773,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_BLA) || 'auto'
        },
        bitLayer: {
            url: process.env.BITLAYER_URL,
            chainId: 200901,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_BIT) || 'auto'
        },
        bitLayerTestnet: {
            url: process.env.BITLAYERTESTNET_URL,
            chainId: 200810,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_BIT) || 'auto'
        },
        merlin: {
            url: process.env.MERLIN_URL,
            chainId: 4200,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_MER) || 'auto'
        },
        merlinTestnet: {
            url: process.env.BITLAYERTESTNET_URL,
            chainId: 200810,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_MER) || 'auto'
        },
        scroll: {
            url: process.env.SCROLL_URL,
            chainId: 534352,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_SCR) || 'auto'
        },
        scrollTestnet: {
            url: process.env.SCROLLTESTNET_URL,
            chainId: 534351,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_SCR) || 'auto'
        },
        coreDao: {
            url: process.env.COREDAO_URL,
            chainId: 1116,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_COR) || 'auto'
        },
        coreDaoTestnet: {
            url: process.env.COREDAOTESTNET_URL,
            chainId: 1115,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_COR) || 'auto'
        },
        beraTestnet: {
            url: process.env.BERATESTNET_URL,
            chainId: 80084,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: parseInt(process.env.GAS_PRICE_BER) || 'auto'
        }
    },

    etherscan: {
        apiKey: process.env.SCAN_API_KEY,
        customChains: [
            {
                network: "blastTestnet",
                chainId: 168587773,
                urls: {
                  apiURL: "",
                  browserURL: ""
                }        
              },
              {
                network: "blast",
                chainId: 81457,                        
                urls: {
                  apiURL: "https://api.routescan.io/v2/network/mainnet/evm/81457/etherscan",
                  browserURL: "https://blastexplorer.io"
                }
              },
              {
                network: "bitLayerTestnet",
                chainId: 200810,
                urls: {
                  apiURL: "https://api-testnet.btrscan.com/scan/api",
                  browserURL: "https://testnet.btrscan.com/"
                }
              },
              {
                network: "bitLayer",
                chainId: 200901,
                urls: {
                  apiURL: "https://api.btrscan.com/scan/api",
                  browserURL: "https://www.btrscan.com/"
                }
              },
              {
                network: "beraTestnet",
                chainId: 80084,
                urls: {
                  apiURL: "https://api.routescan.io/v2/network/testnet/evm/80084/etherscan",
                  browserURL: "https://bartio.beratrail.io"
                }
              },
              {
                network: "coreDao",
                chainId: 1116,
                urls: {
                  apiURL: "https://api.scan.coredao.org/api",
                  browserURL: "https://scan.coredao.org/"
                }
              }
          ]
    },

    sourcify: {
        // Disabled by default
        // Doesn't need an API key
        enabled: true
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