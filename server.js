const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/user');
const dotenv = require('dotenv');
const studentRoutes = require('./routes/student');
const EmployeeRoutes = require('./routes/employee')
const cors = require('cors'); // <--- ADD THIS LINE: Import the cors package
const auth = require('./routes/auth'); // <--- ADD THIS LINE: Import the auth routes
dotenv.config();

const app = express();
const PORT = 5000;

// Use the correct env variable name (MONGO_URL from docker-compose)

// --- MongoDB Connection Setup ---
// Get the MongoDB URI from environment variables (e.g., from .env or Render config)
// The URI from mongodbConnection.txt is for MongoDB Atlas, not the local 'mongo:27017' from docker-compose.
// Make sure to use the correct URI based on where your MongoDB is hosted.
// If using MongoDB Atlas, uncomment and use the Atlas URI:
const mongoURI = process.env.MONGO_URL; // This would typically be for a local or Render Private Service MongoDB
// const mongoURI = process.env.MONGODB_ATLAS_URI; // Use this if you put your Atlas URI in .env as MONGODB_ATLAS_URI

// Mongoose client options for MongoDB Atlas Stable API version (from mongodbConnection.txt)
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

mongoose.connect(mongoURI, clientOptions) // Use clientOptions for MongoDB Atlas connections
    .then(() => {
        console.log('✅ Connected to MongoDB!');
        // Optional: Ping the deployment to confirm connection (as in mongodbConnection.txt)
        // This is typically for initial connection verification, not for every app start
        mongoose.connection.db.admin().command({ ping: 1 })
            .then(() => console.log("Pinged your deployment. You successfully connected to MongoDB!"))
            .catch(err => console.error("Ping command failed:", err));
    })
    .catch(err => console.error('❌ MongoDB connection error:', err));
// --- End MongoDB Connection Setup ---

// add all the routes here 
app.use(express.json());
// <--- ADD CORS CONFIGURATION HERE ---
// Option 1: Allow all origins (good for quick development, less secure for production)
app.use(cors());

// Option 2: Allow specific origins (recommended for production)
// const corsOptions = {
//   origin: 'http://localhost:5173', // Replace with your React app's exact URL
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Specify allowed HTTP methods
//   allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
//   credentials: true, // Allow cookies to be sent
// };
// app.use(cors(corsOptions));
// <--- END CORS CONFIGURATION ---
app.get('/', async (req, res) => {
    res.json(`🚀 Server is running on http://localhost:${PORT}`);
});

app.use('/auth', auth); // <--- ADD THIS LINE: Use the auth routes
app.use('/api', userRoutes);
app.use('/student', studentRoutes);
app.use('/employee', EmployeeRoutes);


app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});


