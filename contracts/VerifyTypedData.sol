// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title VerifyTypedData
/// @notice This contract is used to verify the signature generated by the chips
/// @dev this is just kept separate for readability
contract VerifyTypedData {
    // EIP712 Domain info, hardcoded for this exercise
    string public domain_name = "productRegistry";
    string public domain_version = "1.0";
    uint256 public domain_chainId = block.chainid;
    address public domain_verifyingContract = address(this);

    /// @notice Verifies the signature generated by the chips
    /// @param _user is the user's wallet address
    /// @param _timestamp is the timestamp when the signature was generated
    /// @param _nonce is the nonce used to generate the signature
    /// @param _signature is the signature generated by the chip
    /// @return ecrecover - the decoded address from the signature
    function verify(
        address _user,
        uint256 _timestamp,
        uint256 _nonce,
        bytes memory _signature
    ) public view returns (address) {
        // EIP721 domain type
        string memory name = domain_name;
        string memory version = domain_version;
        uint256 chainId = domain_chainId;
        address verifyingContract = domain_verifyingContract; // address(this);

        // console.log("address(this): %s", address(this));

        // stringified types
        string
            memory EIP712_DOMAIN_TYPE = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
        string
            memory MESSAGE_TYPE = "Message(address user,uint256 timestamp,uint256 nonce)";

        // hash to prevent signature collision
        bytes32 DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(abi.encodePacked(EIP712_DOMAIN_TYPE)),
                keccak256(abi.encodePacked(name)),
                keccak256(abi.encodePacked(version)),
                chainId,
                verifyingContract
            )
        );

        // hash typed data
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01", // backslash is needed to escape the character
                DOMAIN_SEPARATOR,
                //structhash

                keccak256(
                    abi.encode(
                        keccak256(abi.encodePacked(MESSAGE_TYPE)),
                        _user,
                        _timestamp,
                        _nonce
                    )
                )
            )
        );

        // split signature
        bytes32 r;
        bytes32 s;
        uint8 v;
        if (_signature.length != 65) {
            return address(0);
        }
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        if (v < 27) {
            v += 27;
        }
        if (v != 27 && v != 28) {
            return address(0);
        } else {
            // verify
            // console.log("erecover: %s", ecrecover(hash, v, r, s));
            return ecrecover(hash, v, r, s);
        }
    }
}
