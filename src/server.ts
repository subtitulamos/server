/**
 * This file is covered by the AGPLv3 license, which can be found at the LICENSE file in the root of this project.
 * @copyright 2020 subtitulamos.tv
 */

import http from 'http';
import polka from 'polka';
import { json } from 'body-parser';
import WebSocket from 'ws';
import TokenGrant from './token_grant';

const socketsBySubtitle: { [id: number]: WebSocket[] } = {};
let grantedTokens: TokenGrant[] = [];

function setupInternalListener() {
    const app = polka();
    const internalListenerPort = Number(process.env.INTERNAL_LISTENER_PORT);
    if (!internalListenerPort) {
        console.error("Invalid/undefined internal listener port");
        process.exit(1);
    }

    app.use(json()); // Parsing of body requests with JSON
    app.post('/allow', (req: any, res) => {
        if (!req.body || !req.body.sub_id || !req.body.token) {
            res.end("ERR");
            return;
        }

        grantedTokens.push(new TokenGrant(req.body.sub_id, req.body.token));
        res.end("OK");
    });

    app.post('/message', (req: any, res) => {
        if (!req.body || !req.body.sub_id) {
            res.end("ERR");
            return;
        }

        if (!socketsBySubtitle[req.body.sub_id]) {
            res.end("ERR");
            return;
        }

        socketsBySubtitle[req.body.sub_id].forEach((ws) => {
            ws.send(JSON.stringify(req.body.data));
        });
        res.end("OK");
    });

    app.listen(internalListenerPort, 'localhost', (err: any) => {
        if (err) throw err;
        console.log(`> Running internal listener on localhost:${internalListenerPort}`);
    });
}

function onConnectionCreated(ws: any, req: any) {
    if (!socketsBySubtitle[req.subID]) {
        socketsBySubtitle[req.subID] = [];
    }

    socketsBySubtitle[req.subID].push(ws);

    ws.on('close', function () {
        if (req.body && req.body.subID) {
            socketsBySubtitle[req.body.subID] = socketsBySubtitle[req.body.subID].filter(arrWs => arrWs !== ws);
        }
    });
}

function setupTranslationWebsocket() {
    const publicListenerPort = Number(process.env.PUBLIC_LISTENER_PORT);
    if (!publicListenerPort) {
        console.error("Invalid/undefined public listener port");
        process.exit(1);
    }

    const wssv = new WebSocket.Server({ noServer: true });
    wssv.on('connection', onConnectionCreated);

    const app = polka();
    // @ts-ignore (this is ok!)
    const server = http.createServer(app.handler);
    server.on('upgrade', function upgrade(request: any, socket: any, head: any) {
        const parsedUrl = new URL(`http://localhost${request.url}`);
        const token = parsedUrl.searchParams.get('token') || '';
        const subID = Number(parsedUrl.searchParams.get('subID')) || 0;
        const pathname = parsedUrl.pathname;

        if (pathname !== '/translation-rt') {
            // We only allow upgrades on this endpoint!
            socket.destroy();
            return;
        }

        // Upgrade to WS
        wssv.handleUpgrade(request, socket, head, function done(ws: WebSocket) {
            const ip = request.headers["cf-connecting-ip"] ?? request.socket.remoteAddress;
            const isMyToken = (tok: TokenGrant) => tok.subID === subID && tok.token === token;
            if (!grantedTokens.some(isMyToken)) {
                // console.error(`Rejected websocket from ${ip} for sub ${subID} (token ${token} not allowed)`);
                // return;
            }

            grantedTokens = grantedTokens.filter((tok) => !isMyToken(tok));

            request.subID = subID;
            request.token = token;
            wssv.emit('connection', ws, request);
        });
    });

    server.listen(publicListenerPort, "localhost", () => {
        console.log(`> Running public listener on localhost:${publicListenerPort}`);
    });
}

function setup() {
    setupInternalListener();
    setupTranslationWebsocket();

    // Regularly clean up expired tokens
    setInterval(() => function () {
        if (grantedTokens.length > 0) {
            grantedTokens = grantedTokens.filter((tok) => tok.isValid());
        }
    }, 60000);
}

export { setup };
