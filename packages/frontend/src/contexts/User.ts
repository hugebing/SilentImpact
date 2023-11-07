import { createContext } from 'react'
import { makeAutoObservable } from 'mobx'
import { stringifyBigInts } from '@unirep/utils'
import { Identity } from '@semaphore-protocol/identity'
import { UserState } from '@unirep/core'
import { DataProof } from '@unirep-app/circuits'
import { SERVER } from '../config'
import prover from './prover'
import { ethers } from 'ethers'

class User {
    currentEpoch: number = 0
    latestTransitionedEpoch: number = 0
    hasSignedUp: boolean = false
    data: bigint[] = []
    provableData: bigint[] = []
    userState?: UserState
    provider: any

    constructor() {
        makeAutoObservable(this)
        this.load('0');
    }

    
    async load(
        inputID : string
        ) {
        const id = localStorage.getItem(inputID)
        console.log(`User.ts load id`)
        console.log(id);
        const identity = id ? new Identity(id) : new Identity()
        if (!id) {
            localStorage.setItem(inputID, identity.toString())
        }

        const { UNIREP_ADDRESS, APP_ADDRESS, ETH_PROVIDER_URL } = await fetch(
            `${SERVER}/api/config`
        ).then((r) => r.json())

        const provider = ETH_PROVIDER_URL.startsWith('http')
            ? new ethers.providers.JsonRpcProvider(ETH_PROVIDER_URL)
            : new ethers.providers.WebSocketProvider(ETH_PROVIDER_URL)
        this.provider = provider



        console.log(`User.ts userState data`);
        console.log(provider);
        console.log(prover);
        console.log(UNIREP_ADDRESS);
        console.log(APP_ADDRESS);
        console.log(identity);


        const userState = new UserState({
            provider,
            prover,
            unirepAddress: UNIREP_ADDRESS,
            attesterId: BigInt(APP_ADDRESS),
            id: identity,
        })
        await userState.start()
        this.userState = userState
        await userState.waitForSync()
        this.hasSignedUp = await userState.hasSignedUp()
        if (this.hasSignedUp) {
            await this.loadData()
            this.latestTransitionedEpoch =
                await this.userState.latestTransitionedEpoch()
        }
    }

    get fieldCount() {
        return this.userState?.sync.settings.fieldCount
    }

    get sumFieldCount() {
        return this.userState?.sync.settings.sumFieldCount
    }

    get replNonceBits() {
        return this.userState?.sync.settings.replNonceBits
    }

    get numEpochKeyNoncePerEpoch() {
        return this.userState?.sync.settings.numEpochKeyNoncePerEpoch
    }

    epochKey(nonce: number) {
        if (!this.userState) return '0x'
        const epoch = this.userState.sync.calcCurrentEpoch()
        const key = this.userState.getEpochKeys(epoch, nonce)
        console.log(`User.ts  epochKey`)
        console.log(key)
        return `0x${key.toString(16)}`
    }

    async loadData() {
        if (!this.userState) throw new Error('user state not initialized')

        this.data = await this.userState.getData()
        this.provableData = await this.userState.getProvableData()
    }

    async signup() {
        if (!this.userState) throw new Error('user state not initialized')

        const signupProof = await this.userState.genUserSignUpProof()
        console.log(`User.ts signupProof`)
        console.log(signupProof)
        
        
        const data = await fetch(`${SERVER}/api/signup`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                publicSignals: signupProof.publicSignals.map((n) =>
                    n.toString()
                ),
                proof: signupProof.proof,
            }),
        }).then((r) => r.json())
        console.log(`User.ts data`)
        console.log(data)
        await this.provider.waitForTransaction(data.hash)
        await this.userState.waitForSync()
        this.hasSignedUp = await this.userState.hasSignedUp()
        this.latestTransitionedEpoch = this.userState.sync.calcCurrentEpoch()
        this.loadData()
    }

    async defaultRequestData(
        reqData: { [key: number]: string | number },
        epkNonce: number
    ) {
        
        if (!this.userState) throw new Error('user state not initialized')

        var senderEpochKey = reqData[6];
        var recipientEpochKey = reqData[7];
        var recipientAddress = reqData[8];
        // console.log(senderEpochKey);
        // console.log(recipientEpochKey);

        for (const key of Object.keys(reqData)) {
            if (reqData[+key] === '') {
                delete reqData[+key]
                continue
            }
            if (+key === 6 || +key === 7 || +key === 8) {
                delete reqData[+key]
                continue
            }
        }

        console.log(reqData);

        if (Object.keys(reqData).length === 0) {
            throw new Error('No data in the attestation')
        }
        const epochKeyProof = await this.userState.genEpochKeyProof({
            nonce: epkNonce,
        })

        // const { publicSignals, proof } = await this.proveData2(reqData)
        // var ProvablePublicSignals = publicSignals
        // var ProvableProof = proof
        
        const data = await fetch(`${SERVER}/api/defaultRequest`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(
                stringifyBigInts({
                    reqData,
                    publicSignals: epochKeyProof.publicSignals,
                    proof: epochKeyProof.proof,
                })
            ),
        }).then((r) => r.json())
        await this.provider.waitForTransaction(data.hash)
        await this.userState.waitForSync()
        await this.loadData()
    }

    async requestData(
        reqData: { [key: number]: string | number },
        epkNonce: number
    ) {
        
        if (!this.userState) throw new Error('user state not initialized')

        var senderEpochKey = reqData[6];
        if(reqData[6]==undefined){
            senderEpochKey = reqData[7]
        }
        var recipientEpochKey = reqData[7];
        if(reqData[7]==undefined){
            recipientEpochKey = reqData[6]
        }
        var recipientAddress = reqData[8];
        if(reqData[8]==undefined){
            recipientAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        }
        
        
        // console.log(senderEpochKey);
        // console.log(recipientEpochKey);
        // console.log(`this.userState.chainId`)
        // console.log(this.userState.chainId)
        for (const key of Object.keys(reqData)) {
            if (reqData[+key] === '') {
                delete reqData[+key]
                continue
            }
            if (+key === 6 || +key === 7 || +key === 8) {
                delete reqData[+key]
                continue
            }
        }

        // console.log(reqData);

        if (Object.keys(reqData).length === 0) {
            throw new Error('No data in the attestation')
        }
        const epochKeyProof = await this.userState.genEpochKeyProof({
            nonce: epkNonce,
        })

        const { publicSignals, proof } = await this.proveData2(reqData)
        var ProvablePublicSignals = publicSignals
        var ProvableProof = proof
        
        const data = await fetch(`${SERVER}/api/request`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(
                stringifyBigInts({
                    reqData,
                    publicSignals: epochKeyProof.publicSignals,
                    proof: epochKeyProof.proof,
                    senderEpochKey,
                    recipientEpochKey,
                    ProvablePublicSignals,
                    ProvableProof,
                    recipientAddress
                })
            ),
        }).then((r) => r.json())
        await this.provider.waitForTransaction(data.hash)
        await this.userState.waitForSync()
        await this.loadData()
    }

    async buyDonation(
        amount: number,
    ) {
        
        if (!this.userState) throw new Error('user state not initialized')


        // console.log(reqData);


        // const epochKeyProof = await this.userState.genEpochKeyProof({
        //     nonce: epkNonce,
        // })

        // const { publicSignals, proof } = await this.proveData2(reqData)
        // var ProvablePublicSignals = publicSignals
        // var ProvableProof = proof
        // this.load('0');
        const epoch = this.userState.sync.calcCurrentEpoch()
        const key = this.userState.getEpochKeys(epoch, 0)
        // console.log('key')
        // console.log(key)
        // console.log('key')
        // console.log(key)
        const data = await fetch(`${SERVER}/api/buyDonation`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(
                stringifyBigInts({
                    key, 
                    amount,
                })
            ),
        }).then((r) => r.json())
        await this.provider.waitForTransaction(data.hash)
        await this.userState.waitForSync()
    }

    async stateTransition() {
        if (!this.userState) throw new Error('user state not initialized')

        await this.userState.waitForSync()
        const signupProof = await this.userState.genUserStateTransitionProof()
        const data = await fetch(`${SERVER}/api/transition`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                publicSignals: signupProof.publicSignals.map((n) =>
                    n.toString()
                ),
                proof: signupProof.proof,
            }),
        }).then((r) => r.json())
        await this.provider.waitForTransaction(data.hash)
        await this.userState.waitForSync()
        await this.loadData()
        this.latestTransitionedEpoch =
            await this.userState.latestTransitionedEpoch()
    }

    async proveData(data: { [key: number]: string | number }) {
        if (!this.userState) throw new Error('user state not initialized')
        const epoch = await this.userState.sync.loadCurrentEpoch()
        const stateTree = await this.userState.sync.genStateTree(epoch)
        const index = await this.userState.latestStateTreeLeafIndex(epoch)
        const stateTreeProof = stateTree.createProof(index)
        const provableData = await this.userState.getProvableData()
        const fieldCount = this.userState.sync.settings.fieldCount
        const values = Array(fieldCount).fill(0)
        for (let [key, value] of Object.entries(data)) {
            values[Number(key)] = value
        }
        const attesterId = this.userState.sync.attesterId
        const circuitInputs = stringifyBigInts({
            identity_secret: this.userState.id.secret,
            state_tree_indices: stateTreeProof.pathIndices,
            state_tree_elements: stateTreeProof.siblings,
            data: provableData,
            epoch: epoch,
            chain_id: this.userState.chainId,
            attester_id: attesterId,
            value: values,
        })
        const { publicSignals, proof } = await prover.genProofAndPublicSignals(
            'dataProof',
            circuitInputs
        )
        const dataProof = new DataProof(publicSignals, proof, prover)
        const valid = await dataProof.verify()
        return stringifyBigInts({
            publicSignals: dataProof.publicSignals,
            proof: dataProof.proof,
            valid,
        })
    }

    async proveData2(data: { [key: number]: string | number }) {
        if (!this.userState) throw new Error('user state not initialized')
        const epoch = await this.userState.sync.loadCurrentEpoch()
        const stateTree = await this.userState.sync.genStateTree(epoch)
        const index = await this.userState.latestStateTreeLeafIndex(epoch)
        const stateTreeProof = stateTree.createProof(index)
        const provableData = await this.userState.getProvableData()
        const fieldCount = this.userState.sync.settings.fieldCount
        const values = Array(fieldCount).fill(0)
        for (let [key, value] of Object.entries(data)) {
            values[Number(key)] = value
        }
        const attesterId = this.userState.sync.attesterId
        const circuitInputs = stringifyBigInts({
            identity_secret: this.userState.id.secret,
            state_tree_indices: stateTreeProof.pathIndices,
            state_tree_elements: stateTreeProof.siblings,
            data: provableData,
            epoch: epoch,
            chain_id: this.userState.chainId,
            attester_id: attesterId,
            value: values,
        })
        const { publicSignals, proof } = await prover.genProofAndPublicSignals(
            'dataProof',
            circuitInputs
        )
        const dataProof = new DataProof(publicSignals, proof, prover)
        const valid = await dataProof.verify()
        return await stringifyBigInts({
            publicSignals: dataProof.publicSignals,
            proof: dataProof.proof,
            valid,
        })
        
    }
}

export default createContext(new User())
