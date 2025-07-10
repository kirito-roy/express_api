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
const mongoURI = process.env.MONGO_URL;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB error:', err));

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
app.get('/',async(req, res) => {
    res.send(`🚀 Server is running on http://localhost:${PORT}`);
});

app.use('/auth', auth); // <--- ADD THIS LINE: Use the auth routes
app.use('/api', userRoutes);
app.use('/student', studentRoutes);
app.use('/employee', EmployeeRoutes);


app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});


