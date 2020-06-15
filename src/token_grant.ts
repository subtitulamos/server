/**
 * This file is covered by the AGPLv3 license, which can be found at the LICENSE file in the root of this project.
 * @copyright 2020 subtitulamos.tv
 */

class TokenGrant {
    readonly subID: number;
    readonly token: string;
    readonly expirationTime: number;

    constructor(subID: number, token: string) {
        this.subID = subID;
        this.token = token;
        this.expirationTime = Date.now() + 24 * 60 * 60 * 1000; // valid for 24h
    }

    isValid() {
        return this.expirationTime > Date.now();
    }
}

export default TokenGrant;
