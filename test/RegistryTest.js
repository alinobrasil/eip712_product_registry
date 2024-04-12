const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("ProductRegistry Tests", function () {
    let productRegistry;
    let admin, brand, buyer, chip, buyer2;
    let chainId;

    const domainName = "productRegistry"

    // Deploy the contract once before all tests
    before(async function () {
        console.log("Current Network ID:", network.config.chainId);
        chainId = network.config.chainId;

        const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
        productRegistry = await ProductRegistry.deploy();
        await productRegistry.waitForDeployment();

        console.log("ProductRegistry deployed to:", productRegistry.target);

        [admin, brand, buyer, chip, buyer2] = await ethers.getSigners();
    });

    it("Test signature: create & verify", async function () {

        // EIP712 domain separator
        const domainSeparator = {
            name: domainName,
            version: '1.0',
            chainId: chainId,
            verifyingContract: productRegistry.target,
        };

        // EIP712 message structure
        const message = {
            domain: domainSeparator,
            types: {
                Message: [
                    { name: "user", type: "address" },
                    { name: "timestamp", type: "uint256" },
                    { name: "nonce", type: "uint256" }
                ]
            },
            primaryType: 'Message',
            message: {
                user: buyer.address,
                timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
                nonce: 1,
            }
        };

        // Sign the message
        const signature = await chip.signTypedData(message.domain, message.types, message.message);
        // console.log("the signature: ", signature)

        // console.log("\nverifying ....")
        const result = await productRegistry.verify(message.message.user, message.message.timestamp, message.message.nonce, signature);
        // console.log("chip address: ", chip.address)
        // console.log("result: ", result)

        expect(result).to.equal(chip.address);

    });

    it("Admin registers a brand address", async function () {
        // Register brand address and wait for the transaction receipt
        const txResponse = await productRegistry.connect(admin).registerBrand(brand.address, "Jordan");
        const txReceipt = await txResponse.wait();

        // Read brand info from registry; should match the one we registered
        const nameFromRegistry = await productRegistry.brandName(brand.address);
        // console.log("brand name: ", nameFromRegistry);
        expect(nameFromRegistry).to.equal("Jordan");
    });

    it("Brand registers product", async function () {
        // Register product details before being able to register chips
        const txResponse = await productRegistry.connect(brand).registerProduct("0023", "Air Jordan 18", "black/blue", "9");
        await txResponse.wait(); // Wait for the transaction to be mined

        // Read product info from registry
        const productFromRegistry = await productRegistry.productDetails("0023");

        // Name obtained should match what we registered
        expect(productFromRegistry[2]).to.equal("Air Jordan 18");
    });


    it("brand registers chip", async function () {
        // Register a chip address to the product barcode we just registered
        const txResponse = await productRegistry.connect(brand).registerChip(chip.address, "0023");
        await txResponse.wait(); // Wait for the transaction to be mined

        const chipFromRegistry = await productRegistry.productBarcode(chip.address);
        // console.log("product barcode of this chip: ", chipFromRegistry);
        expect(chipFromRegistry).to.equal("0023");
    });

    it("a buyer claims ownership of a chip", async function () {



        // console.log(await productRegistry.domain_name())
        // console.log(await productRegistry.domain_version())
        // console.log(await productRegistry.domain_chainId())
        // console.log(await productRegistry.domain_verifyingContract())


        //this requires use of timestamp. set real timestamp in hardhat local blockchain
        if (chainId == 31337) {
            await network.provider.send("evm_setNextBlockTimestamp", [Math.floor(Date.now() / 1000) + 10]);
            await network.provider.send("evm_mine");
        }


        //Chip creates a signature
        const domainSeparator = {
            name: domainName,
            version: '1.0',
            chainId: chainId,
            verifyingContract: productRegistry.target,
        };

        const message = {
            domain: domainSeparator,
            types: {
                Message: [
                    { name: "user", type: "address" },
                    { name: "timestamp", type: "uint256" },
                    { name: "nonce", type: "uint256" }
                ]
            },
            primaryType: 'Message',
            message: {
                user: buyer.address,
                timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
                nonce: 2,
            }
        };
        // Sign the message using chip's private key
        const signature = await chip.signTypedData(message.domain, message.types, message.message);


        const decodedAddress = await productRegistry.verify(buyer.address, message.message.timestamp, message.message.nonce, signature);
        // console.log("decoded address: ", decodedAddress);
        // console.log("chip address: ", chip.address);
        expect(decodedAddress).to.equal(chip.address);

        // Brand user tries to claim ownership of the chip
        const txResponse = await productRegistry.connect(buyer).claimOwnership(chip.address, buyer.address, message.message.timestamp, message.message.nonce, signature);
        await txResponse.wait(); // Wait for the transaction to be mined

        const theOwner = await productRegistry.owner(chip.address);
        expect(theOwner).to.equal(buyer.address);

    })

    it("another person (buyer2) claims ownership of chip", async function () {

        const currentTimestamp = Math.floor(Date.now() / 1000)
        const domainSeparator = {
            name: domainName,
            version: '1.0',
            chainId: chainId,
            verifyingContract: productRegistry.target,
        };

        const message = {
            domain: domainSeparator,
            types: {
                Message: [
                    { name: "user", type: "address" },
                    { name: "timestamp", type: "uint256" },
                    { name: "nonce", type: "uint256" }
                ]
            },
            primaryType: 'Message',
            message: {
                user: buyer2.address,
                timestamp: currentTimestamp, // Current timestamp in seconds
                nonce: 3,
            }
        };

        // Sign the message using chip's private key
        const signature = await chip.signTypedData(message.domain, message.types, message.message);

        // Brand user tries to claim ownership of the chip
        const txResponse = await productRegistry.connect(buyer2).claimOwnership(chip.address, buyer2.address, message.message.timestamp, message.message.nonce, signature);
        await txResponse.wait(); // Wait for the transaction to be mined

        const theOwner = await productRegistry.owner(chip.address);
        expect(theOwner).to.equal(buyer2.address);

    })
});
