// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VeriTrust {
    address public admin;

    struct Credential {
        bytes32 credentialHash;
        string institutionName;
        address institutionAddress;
        bool valid;
    }

    struct Institution {
        string name;
        bool isRegistered;
    }

    // Mapping from user -> list of credentials
    mapping(address => Credential[]) public userCredentials;
    mapping(address => Institution) public institutions;
    mapping(address => mapping(address => bool)) public hasConsent;

    event InstitutionRegistered(address indexed institutionAddress, string name);
    event CredentialIssued(address indexed recipient, address indexed institution, bytes32 hash);
    event ConsentGranted(address indexed user, address indexed verifier);
    event ConsentRevoked(address indexed user, address indexed verifier);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Admin only");
        _;
    }

    modifier onlyInstitution() {
        require(institutions[msg.sender].isRegistered, "Institution not registered");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerInstitution(address _institutionAddress, string memory _name) external onlyAdmin {
        institutions[_institutionAddress] = Institution(_name, true);
        emit InstitutionRegistered(_institutionAddress, _name);
    }

    function issueCredential(address _recipient, bytes32 _hash) external onlyInstitution {
        string memory instName = institutions[msg.sender].name;
        
        Credential memory newCred = Credential({
            credentialHash: _hash,
            institutionName: instName,
            institutionAddress: msg.sender,
            valid: true
        });

        userCredentials[_recipient].push(newCred);
        emit CredentialIssued(_recipient, msg.sender, _hash);
    }

    function grantConsent(address _verifier) external {
        hasConsent[msg.sender][_verifier] = true;
        emit ConsentGranted(msg.sender, _verifier);
    }

    function revokeConsent(address _verifier) external {
        hasConsent[msg.sender][_verifier] = false;
        emit ConsentRevoked(msg.sender, _verifier);
    }

    function getCredentialCount(address _user) external view returns (uint256) {
        return userCredentials[_user].length;
    }

    function verifyCredential(address _user, uint256 _index) external view returns (bytes32, string memory, address, bool) {
        require(_index < userCredentials[_user].length, "Index out of bounds");
        Credential memory cred = userCredentials[_user][_index];
        return (cred.credentialHash, cred.institutionName, cred.institutionAddress, cred.valid);
    }
}
