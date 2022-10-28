import * as ws from 'ws';
import { WebSocket } from 'ws';

declare const createWs: ({ wsName, clearOfflineWs, heartbeatTime, wsOptions }?: {
    wsName?: string | undefined;
    clearOfflineWs?: boolean | undefined;
    heartbeatTime?: number | undefined;
    wsOptions?: {} | undefined;
}) => {
    wsServer: ws.Server<WebSocket>;
    middleware: (ctx: any, next: any) => Promise<void>;
    getClient: (uniqueId: string) => WebSocket | undefined;
    getClients: () => Array<WebSocket>;
    broadcast: (data: any, options: {
        mask?: boolean | undefined;
        binary?: boolean | undefined;
        compress?: boolean | undefined;
        fin?: boolean | undefined;
    }, cb?: ((err?: Error) => void) | undefined) => void;
};

export { createWs as default };
