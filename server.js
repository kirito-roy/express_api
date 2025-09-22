const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // <--- ADD THIS LINE: Import the cors package
// import routers here 
const auth = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

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


// --- Middleware ---
app.use(express.json({ limit: '50mb' })); // Allow large JSON bodies
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // For form data

// --- CORS Configuration ---
const corsOptions = {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions)); // Use for dev and production
// --- End CORS Configuration ---
app.get('/', async (req, res) => {
    res.json(`🚀 Server is running on http://localhost:${PORT}`);
});

app.use('/auth', auth); // <--- ADD THIS LINE: Use the auth routes
app.use('/api', userRoutes);
app.use("/admin", adminRoutes);
app.use('/searches', require('./routes/searches'));


app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});


