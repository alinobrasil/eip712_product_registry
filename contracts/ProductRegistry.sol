// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @notice This is an on-chain product registry

import "./VerifyTypedData.sol"; //contains function to verify signature

contract ProductRegistry is VerifyTypedData {
    address public contractAdmin;

    struct Product {
        address brandAddress;
        string barcode;
        string style;
        string color;
        string size;
    }

    // chip information
    mapping(address => string) public productBarcode; //should contain value if chip address was registered by brand
    mapping(address => address) public owner;

    // product information
    mapping(string => Product) public productDetails;

    // brand information
    mapping(address => string) public brandName;

    event BrandRegistered(address indexed brandAddress, string name);
    event ProductRegistered(address indexed brandAddress, string barcode);
    event OwnerRegistered(
        address indexed chipAddress,
        address indexed ownerAddress
    );

    constructor() {
        contractAdmin = msg.sender;
    }

    //contractAdmin functions---------------------------------------------

    /// @notice Sets a new contract admin
    function setAdmin(address newAdmin) public {
        require(msg.sender == contractAdmin, "Only admin can set admin");
        contractAdmin = newAdmin;
    }

    /// @notice contract admin whitelists brands. each brand can then manage their own chips/product information
    /// @param brandAddress is the brand's wallet address used to manage chips/products in this registry. this address is used as the brand's unique identifier
    /// @param _brandName is the brand's name
    function registerBrand(
        address brandAddress,
        string memory _brandName
    ) public {
        require(msg.sender == contractAdmin, "Only admin can register brand");
        require(
            keccak256(abi.encodePacked(brandName[brandAddress])) ==
                keccak256(abi.encodePacked("")),
            "Brand already registered"
        );

        brandName[brandAddress] = _brandName;
        emit BrandRegistered(brandAddress, _brandName);
    }

    //brandUser functions ------------------------------------------------
    /// @notice brand admin registers a product, just to store product details on chain
    function registerProduct(
        string memory barcode,
        string memory style,
        string memory color,
        string memory size
    ) public {
        require(
            keccak256(abi.encodePacked(brandName[msg.sender])) !=
                keccak256(abi.encodePacked("")),
            "Brand not registered"
        );

        // products are all tagged with brandUser's address
        Product memory product = Product(
            msg.sender,
            barcode,
            style,
            color,
            size
        );

        productDetails[barcode] = product;

        emit ProductRegistered(msg.sender, barcode);
    }

    /// @notice brand admin registers a chip
    /// @param chipAddress is the public key on the chip
    /// @param barcode is the product barcode
    function registerChip(address chipAddress, string memory barcode) public {
        //must be a brand user
        require(
            keccak256(abi.encodePacked(brandName[msg.sender])) !=
                keccak256(abi.encodePacked("")),
            "Brand not registered"
        );

        //must be a product registered by the brand
        require(
            keccak256(abi.encodePacked(productDetails[barcode].barcode)) ==
                keccak256(abi.encodePacked(barcode)),
            "Product not registered"
        );

        productBarcode[chipAddress] = barcode;

        emit OwnerRegistered(chipAddress, msg.sender);
    }

    //chipUser (buyer/collector) functions ------------------------------------------------
    /// @notice item owner/collector claims ownership of a chip. They should be able to do so if they have the item in front of them
    /// @param chipAddress is the public key on the chip
    /// _user, _timestamp and nonce are used to verify the signature
    /// @param signature is the EIP712 signature of a message containing timestamp when the chip was scanned and the chip address
    function claimOwnership(
        address chipAddress,
        address _user,
        uint256 _timestamp,
        uint256 _nonce,
        bytes memory signature
    ) public {
        //must be a chip registered by a brand
        require(
            keccak256(abi.encodePacked(productBarcode[chipAddress])) !=
                keccak256(abi.encodePacked("")),
            "Chip not registered"
        );

        require(
            verify(_user, _timestamp, _nonce, signature) == chipAddress,
            "Signature is invalid"
        );

        // console.log("block timestamp: %s", block.timestamp);
        require(
            block.timestamp <= _timestamp + 600,
            "Signature expired (5minutes)"
        );

        //overwrite previous owner
        owner[chipAddress] = msg.sender;

        emit OwnerRegistered(chipAddress, msg.sender);
    }
}
