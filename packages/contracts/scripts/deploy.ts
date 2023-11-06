// import { ethers2 } from 'ethers'
import { ethers } from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'
import { deployUnirep } from '@unirep/contracts/deploy/index.js'
import * as hardhat from 'hardhat'




const epochLength = 150

deployApp().catch((err) => {
    console.log(`Uncaught error: ${err}`)
    process.exit(1)
})

export async function deployApp() {
    const [signer] = await ethers.getSigners()
    const unirep = await deployUnirep(signer)

    const verifierF = await ethers.getContractFactory('DataProofVerifier')
    const verifier = await verifierF.deploy()
    await verifier.deployed()
    const App = await ethers.getContractFactory('UnirepApp')
    const app = await App.deploy(unirep.address, verifier.address, epochLength)

    await app.deployed()

    console.log(
        `Unirep app with epoch length ${epochLength} is deployed to ${app.address}`
    )
    // console.log(await ethers.getBalance('0x9E10a814710C2B1f5a2477C2Eca4d70a32F3aFe5'))




    const config = `export default {
    UNIREP_ADDRESS: '${unirep.address}',
    APP_ADDRESS: '${app.address}',
    ETH_PROVIDER_URL: '${hardhat.network.config.url ?? ''}',
    ${
        Array.isArray(hardhat.network.config.accounts)
            ? `PRIVATE_KEY: '${hardhat.network.config.accounts[0]}',`
            : `/**
      This contract was deployed using a mnemonic. The PRIVATE_KEY variable needs to be set manually
    **/`
    }
  }
  `

    const configPath = path.join(__dirname, '../../../config.ts')
    await fs.promises.writeFile(configPath, config)

    console.log(`Config written to ${configPath}`)





    const contract = await App.attach('0x9A676e781A523b5d0C0e43731313A708CB607508'); // 替换为你的合约地址
  
    // 获取当前以太币账户
    const [sender] = await ethers.getSigners();
  
    // 指定要发送的 ETH 数量（以 wei 为单位）
    const ethAmount = ethers.utils.parseEther('1000'); // 发送 1000 ETH
  
    // 发送 ETH 到合约
    const tx = await sender.sendTransaction({
      to: contract.address,
      value: ethAmount
    });
  
    // 等待交易确认
    await tx.wait();
}
