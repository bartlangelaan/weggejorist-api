import api from './api';
import mongoose from 'mongoose';

// Set up mongoose
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/weggejorist');
mongoose.Promise = Promise;

api.listen(process.env.PORT || 3000);