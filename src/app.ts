import { db, client } from './db';
import { DB_NAME } from './db/config';
import WASockHandler from './wa/waSockHandler'
import ApiServer from './server';
import { existsSync } from 'fs';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import exitHandler from './exitHandler';

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
    // Create directories if they don't exist
    if (!existsSync(join(__dirname, '..', 'media'))) {
        await mkdir(join(__dirname, '..', 'media'));
        console.log('Created media directory')
    }
    // Connect to MongoDB
    await connMongoDB();
    sockHandler = new WASockHandler();
    // Create new server instance
    new ApiServer(client, DB_NAME);
}

main().catch(console.dir);

// Exit gracefully
exitHandler(() => {
    console.log('Cleaning up...');
    client.close().then();
});

export { sockHandler };