pragma circom 2.1.0;

include "../../../node_modules/@unirep/circuits/circuits/hasher.circom";
include "../../../node_modules/@unirep/circuits/circuits/incrementalMerkleTree.circom";
include "../../../node_modules/@unirep/circuits/circuits/bigComparators.circom";
include "../../../node_modules/@unirep/circuits/circuits/circomlib/circuits/comparators.circom";


template DataProof(STATE_TREE_DEPTH, FIELD_COUNT, SUM_FIELD_COUNT, REPL_NONCE_BITS) {

    assert(SUM_FIELD_COUNT < FIELD_COUNT);

    // State tree leaf: Identity & user state root
    signal input identity_secret;
    // State tree
    signal input state_tree_indices[STATE_TREE_DEPTH];
    signal input state_tree_elements[STATE_TREE_DEPTH];
    signal input attester_id;
    signal input data[FIELD_COUNT];
    signal output state_tree_root;
    signal input epoch;
    signal input chain_id;

    // Prove values
    signal input value[FIELD_COUNT];

    /* 1. Check if user exists in the State Tree */

    // Compute state tree root
    signal leaf;
    (leaf, _, _) <== StateTreeLeaf(FIELD_COUNT)(data, identity_secret, attester_id, epoch, chain_id);

    state_tree_root <== MerkleTreeInclusionProof(STATE_TREE_DEPTH)(leaf, state_tree_indices, state_tree_elements);

    /* End of check 1 */

     /* 2. Check if user data more than given value */
    signal get[SUM_FIELD_COUNT];
    for (var x = 0; x < SUM_FIELD_COUNT; x++) {
        if(x == 2 || x == 3){
            get[x] <== LessEqThan(252)([data[x], value[x]]);
            get[x] === 1;

        } else {
            get[x] <== GreaterEqThan(252)([data[x], value[x]]);
            get[x] === 1;
        }
    }
    /* End of check 2 */

    /* 3. Check if replacement data matches given value */
    signal equal_check[FIELD_COUNT - SUM_FIELD_COUNT];
    signal upper_bits[FIELD_COUNT - SUM_FIELD_COUNT];
    for (var x = 0; x < (FIELD_COUNT - SUM_FIELD_COUNT); x++) {
        (upper_bits[x], _) <== ExtractBits(REPL_NONCE_BITS, 253-REPL_NONCE_BITS)(data[SUM_FIELD_COUNT + x]);
        // equal_check[x] <== IsEqual()([upper_bits[x], value[SUM_FIELD_COUNT + x]]);
        // equal_check[x] === 1;
    }
    // /* End of check 3 */
    
    /* 4. 
        [0] donationBuyAmount
        [1] receivedDonationAmount
        [2] donationSellAmount
        [3] donationAmount
        [SUM_FIELD_COUNT] donationToBeSellAmount
        [SUM_FIELD_COUNT + 1] donationAmountToGive
    */
    
    signal owned;
    signal used;
    signal prepareToUse;

    signal haveDonation;
    signal temp;
    signal temp2;
    signal temp3;

    owned <== value[0] + value[1];
    used <== value[2] + value[3];

    temp <== GreaterEqThan(252)([owned, used]);
    temp === 1;

    prepareToUse <== value[4] + value[5];
    haveDonation <== owned - used;

    log(haveDonation);
    log(prepareToUse);
    log(upper_bits[0]);
    log(upper_bits[1]);
    
    temp2 <== GreaterEqThan(252)([haveDonation, prepareToUse]);
    temp2 === 1; 


    // /* End of check 4 */
}