import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/db/db.js';
import { connectRedis } from './src/db/redis.js';

connectDB();

connectRedis().catch((error) => {
    console.error('Redis connection failed:', error.message);
});


app.listen(3001, () => {
    console.log('Server is running on port 3001');
});