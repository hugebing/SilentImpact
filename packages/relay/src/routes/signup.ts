import { SignupProof, Prover } from '@unirep/circuits'
import { ethers } from 'ethers'
import { Express } from 'express'
import { Synchronizer } from '@unirep/core'
import { APP_ADDRESS } from '../config'
import TransactionManager from '../singletons/TransactionManager'
import ABI from '@unirep-app/contracts/abi/UnirepApp.json'

export default (app: Express, prover: Prover, synchronizer: Synchronizer) => {
    app.post('/api/signup', async (req, res) => {
        try {
            console.log(`signup.ts calldata`)
            const { publicSignals, proof } = req.body

            const signupProof = new SignupProof(publicSignals, proof, prover)
            const valid = await signupProof.verify()
            if (!valid) {
                res.status(400).json({ error: 'Invalid proof' })
                return
            }
            const currentEpoch = synchronizer.calcCurrentEpoch()
            if (currentEpoch !== Number(signupProof.epoch)) {
                res.status(400).json({ error: 'Wrong epoch' })
                return
            }
            console.log(`signup.ts ABI`);
            console.log(ABI);
            // make a transaction lil bish
            const appContract = new ethers.Contract(APP_ADDRESS, ABI)
            // const contract =
            const calldata = appContract.interface.encodeFunctionData(
                'userSignUp',
                [signupProof.publicSignals, signupProof.proof]
            )
            console.log(`signup.ts calldata`)
            console.log(calldata)
            const hash = await TransactionManager.queueTransaction(
                APP_ADDRESS,
                calldata
            )
            console.log(`signup.ts hash`)
            console.log(hash)
            res.json({ hash })
        } catch (error) {
            res.status(500).json({ error })
        }
    })
}
