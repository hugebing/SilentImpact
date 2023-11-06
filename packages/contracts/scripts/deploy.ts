import { ethers2 } from 'ethers'
import { ethers } from 'hardhat'
import * as fs from 'fs'
import * as path from 'path'
import { deployUnirep } from '@unirep/contracts/deploy/index.js'
import * as hardhat from 'hardhat'




const epochLength = 300

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



    // console.log(hardhat.network.config);
    // const provider = 'http://localhost:8545'.startsWith('http')
    // ? new ethers.providers.JsonRpcProvider('http://localhost:8545')
    // : new ethers.providers.WebSocketProvider('http://localhost:8545')
    // const senderAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'; // 发送以太币的账户地址
    // const senderPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // 发送以太币的账户私钥
    
    // // 以太币发送者的钱包
    // const senderWallet = new ethers2.Wallet(senderPrivateKey, provider); // 使用你的 provider

    // // 以太币接收地址，即 UnirepApp 合约地址
    // const contractAddress = app.address;

    // // 以太币数量（示例：发送 1 ETH）
    // const valueToSend = ethers2.utils.parseEther('1.0'); // 1 ETH

    // // 构建以太币交易
    // const tx = {
    // to: contractAddress,
    // value: valueToSend,
    // };

    // // 发送以太币到 UnirepApp 合约
    // const sendTransaction = await senderWallet.sendTransaction(tx);

    // // 等待交易被确认
    // const receipt = await sendTransaction.wait();
    // console.log('Transaction hash:', receipt.transactionHash);



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
    const ethAmount = ethers.utils.parseEther('1000'); // 发送 1 ETH
  
    // 发送 ETH 到合约
    const tx = await sender.sendTransaction({
      to: contract.address,
      value: ethAmount
    });
  
    // 等待交易确认
    await tx.wait();
}
