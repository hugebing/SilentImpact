import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import { task } from 'hardhat/config'
import * as fs from 'fs'



export default {
    defaultNetwork: 'local',
    networks: {
        hardhat: {
            blockGasLimit: 12000000,
        },
        local: {
            url: 'http://127.0.0.1:8545',
            blockGasLimit: 12000000,
            accounts: [
                '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            ],
        },
        arb: {
            url: 'https://arbitrum.goerli.unirep.io',
            accounts: [
                '0x0f70e777f814334daa4456ac32b9a1fdca75ae07f70c2e6cef92679bad06c88b',
            ],
        },
    },
    solidity: {
        compilers: [
            {
                version: '0.8.17',
                settings: {
                    optimizer: { enabled: true, runs: 200 },
                },
            },
        ],
    },
}

task("buyDonation", "Buy donation")
  .addParam("epochkey", "The epochKey")
  .addParam("amount", "ETH amount")
  .addParam("targetepoch", "The targetEpoch")
  .setAction(async (taskArgs, hre) => {
    const App = await hre.ethers.getContractFactory('UnirepApp')
    const appAddress = fs.readFileSync(".appAddress").toString();
    const amountWei = hre.ethers.utils.parseUnits(taskArgs.amount);
    console.log("appAddres: " + appAddress);
    const app = await App.attach(appAddress);
    const tx = await app.buyDonation(taskArgs.epochkey, taskArgs.amount, taskArgs.targetepoch,{ value: amountWei });
    await tx.wait(1);
    console.log("epochkey: " + taskArgs.epochkey);
  });