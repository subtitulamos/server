/**
 * This file is covered by the AGPLv3 license, which can be found at the LICENSE file in the root of this project.
 * @copyright 2020 subtitulamos.tv
 */

class Subtitle {
    readonly id: number;
    tokens: string[] = [];

    constructor(subID: number) {
        this.id = subID;
    }
}

export default Subtitle;
