/**
 * This file is covered by the AGPLv3 license, which can be found at the LICENSE file in the root of this project.
 * @copyright 2020 subtitulamos.tv
 */

import polka from 'polka';

function setupInternalListener() {
    const TRANSLATION_LISTENER_PORT = Number(process.env.TRANSLATION_LISTENER_PORT) || 17456;

    const app = polka();
    app.get('/hello', (req: any, res) => {
        res.end(`Hello world`);
    });

    app.listen(TRANSLATION_LISTENER_PORT, 'localhost', (err: any) => {
        if (err) throw err;
        console.log(`> Running on localhost:${TRANSLATION_LISTENER_PORT}`);
    });
}

export { setupInternalListener };
