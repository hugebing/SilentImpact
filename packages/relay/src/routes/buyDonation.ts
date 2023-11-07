import { ethers } from 'ethers'
// import { ethers } from 'hardhat'
import { Express } from 'express'
import { Synchronizer } from '@unirep/core'
import { EpochKeyProof, Prover } from '@unirep/circuits'
import { APP_ADDRESS } from '../config'
import TransactionManager from '../singletons/TransactionManager'
import ABI from '@unirep-app/contracts/abi/UnirepApp.json'

export default (app: Express, prover: Prover, synchronizer: Synchronizer) => {
    app.post('/api/buyDonation', async (req, res) => {

        try {
            const { key, amount } = req.body

            console.log('amount')
            console.log(amount)
            const epoch = await synchronizer.loadCurrentEpoch()
            const appContract = new ethers.Contract(APP_ADDRESS, ABI)

            const calldata = appContract.interface.encodeFunctionData(
                'buyDonation',
                [
                    key, 
                    amount,
                    epoch
                ]
            )            

            const hash = await TransactionManager.queueBuyDonationTransaction(
                APP_ADDRESS,
                calldata,
                amount,
            )

            // const App = await ethers.getContractFactory('UnirepApp')

            // const contract = await App.attach('0x9A676e781A523b5d0C0e43731313A708CB607508'); // 替换为你的合约地址
  
            // // 获取当前以太币账户
            // const [sender] = await ethers.getSigners();
          
            // const tx = await sender.buyDonation(key, amount, epoch, {
            //     value: amount, 
            //   });
          
            // // 等待交易确认
            // const hash = await tx.wait()
            res.json({ hash })

            
        } catch (error: any) {
            res.status(500).json({ error })
        }
    })
}



