﻿//////////////////////////////////////////////////////////////////////
/////               Author: Матвей Т <matveit.dev>               /////
/////                        License: MIT                        /////
/////           Not removing this header is appreciated          /////
//////////////////////////////////////////////////////////////////////

import * as oak from "https://deno.land/x/oak/mod.ts";
import * as custom from "./server.custom.ts";

const clientCodePath = "./hypersocket/client/client.js";
const CLIENT_CODE: string = Deno.readTextFileSync(new URL(clientCodePath, import.meta.url));

/**
 * Initializes a new HyperSocketServer instance using oak.
 * @param {oak.Router} router The oak router to use
 * @returns {HyperSocketServer} The HyperSocketServer instance
 */
export function initHyperSocketServer(
    router: oak.Router
): custom.HyperSocketServer {
    const impl = custom.initCustomHSS();
    router.get(custom.WEBSOCKET_UPGRADE_PATH, async (ctx: oak.Context) => {
        let socket;
        try {
            socket = await ctx.upgrade();
        } catch (err) {
            ctx.response.status = 500;
            ctx.response.body = "Unable to upgrade to socket";
            return;
        }
        const id = ctx.request.url.searchParams.get("id");
        if (id === null) {// if the id is not provided, close the socket
            socket.close(1008, "ID not provided");
            return;
        }
        if (!impl.isIDAvailable(id)) {// if the username is already taken, close the socket
            socket.close(1008, `ID: ${id} is already taken`);
            return;
        }
        impl.addSocket(socket, id);
    });
    router.get(custom.CLIENT_CODE_PATH_CJS, (ctx: oak.Context) => {
        ctx.response.body = CLIENT_CODE;
        ctx.response.type = "application/javascript";
    });
    return impl;
}

export * from "./hypersocket/server/mod.ts";
export default initHyperSocketServer;
