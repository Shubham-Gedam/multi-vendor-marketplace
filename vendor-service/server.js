import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/db/db.js';
import { connectRedis } from './src/db/redis.js';

await connectDB();
await connectRedis();

app.listen(3002, () => {
    console.log('Server is running on port 3002');
});