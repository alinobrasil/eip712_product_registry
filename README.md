# Using EIP712 in a Hypothetical On-Chain Product Registry
Here's a simple on-chain product registry that utilizes EIP712 to generate signatures and then verify it on-chain.

The product registry enables brands to register their products. When buyers buy a product, they can claim ownership on-chain. Intended for rare collector items.

This assumes the products have embedded chips (hardware wallets) that can generate EIP712 signatures. 

When a collector claims ownership of a product, they'll see details of the message they are signing, like product info, time of signing, nonce.   
<br>
<br>

# Running the tests

## Dependencies:
Go to the root of this project and run:
```
npm install
```

## Running on local testnet (hardhat node)
Simply run this:
```
npx hardhat test test/RegistryTest.js
```

It'll simulate this full workflow:
-deploying contract
-admin registers a brand's account address
-brand registers their product info
-brand registers their chips before they go live
-a buyer (customer/user) registers themself onchain as new owner

## EIP712 in action
The test script `test/RegistryTest.js` simulates a chip that generates an EIP712 compliant signature (in the test named [*a buyer claims ownership of a chip*](https://github.com/alinobrasil/eip712_product_registry/blob/main/test/RegistryTest.js#L101)). It uses `signTypedData` from Ethers.js v6 to generate the signature.

It calls a `verify` function in a smart contract. The implementation is in `VerifyTypedData.sol`. 

Forgive me on hardcoding the domain separator info. But I trust you'll deal with that easily.

In the end, this test passes as the chip address matches the decoded address obtained from the `Verify` function.

<br>
<br>
<br>

# About this Registry

## Assumptions
Some big assumptions are being made here. 

 - Products have embedded "chips" that are capable of generating EIP712 signatures as they are essentially hardware wallets. Each chip has a unique address.

 - Each brand will use one address to manage their registered chips and products.

 - Fashion brands generally have UPCs (barcodes) that each represent a specific season-style-size-color combination. So for each barcode, there will be many associated chip addresses. 

 - Brand registers each chipAddress to registry when it's ready to be sold.

 - Chip can sign signature with nonce, buyer's address and timestamp.

## Where does the trust-worthiness of this registry come from? 
It's only as good as the brand's address used to initially register the products in the registry. So when initially setting up products in the registry, each brand should have their own address and publicly attest that it is their address. (eg. social media or website. the more the merrier. Maybe later on Ethereum Attestation Service, attestations from credible addresses)


## Transferring
No separate function or process for transferring to new owner. If you have the physical item, you should be able to obtain the signature to register yourself as the new owner. That essentially represents a transfer.

Yes, if you steal an item, you can register yourself as the new owner if that's what you want to do. 

## Ownership attribution
A simple mapping of chip address to owner address. It should be as simple as that. If you have the physical item you should have access to claim ownership.

