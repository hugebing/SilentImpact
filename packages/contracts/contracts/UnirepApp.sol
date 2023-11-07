// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import {Unirep} from '@unirep/contracts/Unirep.sol';
import {IUnirep} from '@unirep/contracts/interfaces/IUnirep.sol';

// Uncomment this line to use console.log
import "hardhat/console.sol";

interface IVerifier {
    function verifyProof(
        uint256[7] calldata publicSignals,
        uint256[8] calldata proof
    ) external view returns (bool);
}

contract UnirepApp is IUnirep{
    Unirep public unirep;
    IVerifier internal dataVerifier;
    // Unirep social's attester ID
    uint160 public immutable attesterId;
    uint256 public immutable receivedAmountIndex = 1;
    uint256 public immutable hadWithdrawAmountIndex = 2;
    uint256 public immutable withdrawAmountIndex = 4;

    receive() external payable {

    }

    // Attester id == address
    mapping(uint160 => AttesterData) attesters;

    constructor(Unirep _unirep, IVerifier _dataVerifier, uint48 _epochLength) {
        // set unirep address
        unirep = _unirep;

        // set verifier address
        dataVerifier = _dataVerifier;

        // sign up as an attester
        unirep.attesterSignUp(_epochLength);
        attesterId = uint160(address(this));
    }

    // sign up users in this app
    function userSignUp(
        uint256[] calldata publicSignals,
        uint256[8] calldata proof
    ) public {
        unirep.userSignUp(publicSignals, proof);
    }

    function submitManyAttestations(
        uint256 epochKey,
        uint48 targetEpoch,
        uint[] calldata fieldIndices,
        uint[] calldata vals
    ) public {
        require(fieldIndices.length == vals.length, 'arrmismatch');
        for (uint8 x = 0; x < fieldIndices.length; x++) {
            unirep.attest(epochKey, targetEpoch, fieldIndices[x], vals[x]);
        }
    }

    function submitAttestation(
        uint256 epochKey,
        uint48 targetEpoch,
        uint256 fieldIndex,
        uint256 val
    ) public {
        unirep.attest(epochKey, targetEpoch, fieldIndex, val);
    }

    /* 4. 
        [0] donationBuyAmount
        [1] receivedDonationAmount
        [2] donationSellAmount
        [3] donationAmount
        [SUM_FIELD_COUNT] donationToBeSellAmount
        [SUM_FIELD_COUNT + 1] donationAmountToGive
    */



    function impactAttestation(
        uint256 senderEpochKey,
        uint256 recipientEpochKey,
        uint48 targetEpoch,
        uint[6] calldata fieldIndices,
        uint[6] calldata vals,
        uint256[7] calldata publicSignals,
        uint256[8] calldata proof,
        address sender
    ) public {

        require(dataVerifier.verifyProof(
            publicSignals,
            proof
        ), 'Get error message');
        
        console.log("a");
        for (uint8 x = 4; x < fieldIndices.length; x++) {
            console.log("b x=%s", x);
            if (x == 4) {
                console.log("c vals=%s", vals[x]);
                unirep.attest(
                    senderEpochKey,
                    targetEpoch,
                    fieldIndices[2],
                    vals[x]
                );
            console.log("d vals=%s", vals[x]);
            (bool success, ) = sender.call{value: vals[x] * 1 ether}("");
            require(
                success,
                ": Unable to send value"
            );
            } else if (x == 5) {
                console.log("e vals=%s", vals[x]);
                unirep.attest(
                    senderEpochKey,
                    targetEpoch,
                    fieldIndices[3],
                    vals[x]
                );
                unirep.attest(
                    recipientEpochKey,
                    targetEpoch,
                    fieldIndices[1],
                    vals[x]
                );
            }
        } 
    }

    function buyDonation (
        uint256 epochKey, 
        uint256 amount,
        uint48 targetEpoch
        ) payable public {
        
        require(msg.value == amount * 1 ether, ":Send wrong ETH value");
        (bool success, ) = msg.sender.call{value: amount * 1 ether}("");
        require(
            success,
            ": Unable to send value, recipient may have reverted"
        );
        unirep.attest(
            epochKey,
            targetEpoch,
            0,
            amount
        );
    }

    function verifyDataProof(
        uint256[7] calldata publicSignals,
        uint256[8] calldata proof
    ) public view returns (bool) {
        return dataVerifier.verifyProof(publicSignals, proof);
    }

}

