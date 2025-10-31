// src/config/db.ts
import mongoose from 'mongoose';
import { config } from './env';
import { logger } from './logger';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    import('../models/Message');
    import('../models/Match');
    logger.info('MongoDB Connected...');
  } catch (err: any) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;