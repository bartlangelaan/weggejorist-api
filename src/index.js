import api from './api';
import mongoose from 'mongoose';
import bluebird from 'bluebird';

// Set up mongoose
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/weggejorist');
mongoose.Promise = bluebird.Promise;

api.listen(process.env.PORT || 3000);