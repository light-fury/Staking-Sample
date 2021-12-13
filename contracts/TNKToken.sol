
// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TNKToken is ERC20 {
    constructor() ERC20("TNKToken", "TNK") {
        _mint(_msgSender(), 100_000_000_000 * 10**18 );
    }
}