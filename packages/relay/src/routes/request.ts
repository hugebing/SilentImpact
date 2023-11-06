import { ethers } from 'ethers'
import { Express } from 'express'
import { Synchronizer } from '@unirep/core'
import { EpochKeyProof, Prover } from '@unirep/circuits'
import { APP_ADDRESS } from '../config'
import TransactionManager from '../singletons/TransactionManager'
import ABI from '@unirep-app/contracts/abi/UnirepApp.json'

export default (app: Express, prover: Prover, synchronizer: Synchronizer) => {
    app.post('/api/request', async (req, res) => {

        try {
            const { reqData, 
                publicSignals, 
                proof, 
                senderEpochKey, 
                recipientEpochKey, 
                recipientAddress,
                ProvablePublicSignals,
                ProvableProof} = req.body

            const epochKeyProof = new EpochKeyProof(
                publicSignals,
                proof,
                prover,
            )

            const valid = await epochKeyProof.verify()
            if (!valid) {
                res.status(400).json({ error: 'Invalid proof' })
                return
            }
            const epoch = await synchronizer.loadCurrentEpoch()
            const appContract = new ethers.Contract(APP_ADDRESS, ABI)

            const keys = Object.keys(reqData)
            let calldata: any

            console.log(`APP_ADDRESS`)
            console.log(APP_ADDRESS)
            console.log(`epochKeyProof.epochKey`)
            console.log(epochKeyProof.epochKey)
            console.log(`senderEpochKey`)
            console.log(senderEpochKey)
            console.log(`recipientEpochKey`)
            console.log(recipientEpochKey)
            console.log(`epoch`)
            console.log(epoch)
            console.log(`keys`)
            console.log(keys)
            console.log(`keys.map((k) => reqData[k])`)
            console.log(keys.map((k) => reqData[k]))
            console.log(`publicSignals`)
            console.log(publicSignals)
            console.log(`proof`)
            console.log(proof)
            console.log(`ProvablePublicSignals`)
            console.log(ProvablePublicSignals)
            console.log(`ProvableProof`)
            console.log(ProvableProof)
            console.log(`recipientAddress`)
            console.log(recipientAddress)


            console.log(BigInt(senderEpochKey))
            console.log(BigInt(recipientEpochKey))
            

            if (keys.length === 1) {
                calldata = appContract.interface.encodeFunctionData(
                    'submitAttestation',
                    [epochKeyProof.epochKey, epoch, keys[0], reqData[keys[0]]]
                )
            } else if (keys.length > 1) {
                calldata = appContract.interface.encodeFunctionData(
                    'impactAttestation',
                    [
                        BigInt(senderEpochKey),
                        BigInt(recipientEpochKey),
                        epoch,
                        keys,
                        keys.map((k) => reqData[k]),
                        ProvablePublicSignals,
                        ProvableProof,
                        recipientAddress
                    ]
                )
            }

            const hash = await TransactionManager.queueTransaction(
                APP_ADDRESS,
                calldata
            )

            res.json({ hash })
        } catch (error: any) {
            res.status(500).json({ error })
        }
    })
}



