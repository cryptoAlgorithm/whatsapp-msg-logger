import { db, client } from './db';
import { DB_NAME } from './db/config';
import WASockHandler from './wa/waSockHandler'
import ApiServer from './server';

// Create a WASocket
let sockHandler: WASockHandler = null;

// ====== MongoDB connection and ping ====== //
async function connMongoDB() {
    // Connect the client to the server
    await client.connect();

    // Establish and verify connection
    await db.command({ ping: 1 });
    console.log('Connected successfully to MongoDB server!');
}

async function main() {
    console.log('Initializing...');
    await connMongoDB();
    sockHandler = new WASockHandler();
    // Create new server instance
    const apiServer = new ApiServer(client, DB_NAME);
}

main().catch(console.dir);

// Exit gracefully
import exitHandler from './exitHandler';
exitHandler(() => {
    console.log('Cleaning up...');
    client.close().then();
});

export { sockHandler };