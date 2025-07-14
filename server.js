const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/user');
const dotenv = require('dotenv');
const cors = require('cors'); // <--- ADD THIS LINE: Import the cors package
const auth = require('./routes/auth'); // <--- ADD THIS LINE: Import the auth routes
dotenv.config();

const app = express();
const PORT = 5000;

// Use the correct env variable name (MONGO_URL from docker-compose)
// --- MongoDB Connection Setup ---

// Select the right MongoDB URI based on environment
const mongoURI = process.env.MONGODB_ATLAS_URI || process.env.MONGO_URL;

if (!mongoURI) {
    console.error('❌ No MongoDB connection string found in environment variables!');
    process.exit(1);
}

// Options: Only use serverApi for Atlas
const isAtlas = mongoURI.includes('mongodb+srv://');
const clientOptions = isAtlas
    ? { serverApi: { version: '1', strict: true, deprecationErrors: true } }
    : {}; // Empty options for local/dev

mongoose.connect(mongoURI, clientOptions)
    .then(() => {
        console.log('✅ Connected to MongoDB:', isAtlas ? 'Atlas (production)' : 'Local/Docker (development)');
        if (isAtlas) {
            // Optional: Ping Atlas deployment
            mongoose.connection.db.admin().command({ ping: 1 })
                .then(() => console.log('🏓 Pinged MongoDB Atlas successfully!'))
                .catch(err => console.warn('⚠️ Ping failed:', err));
        }
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });
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



app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});


