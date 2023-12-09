import express from 'express';
import dotenv from 'dotenv';
import device from 'express-device';
import connectDB from './db/connectDB.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js'

dotenv.config();

connectDB();
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(device.capture());

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.listen(3000, () => console.log(`Server started at port ${PORT}`));