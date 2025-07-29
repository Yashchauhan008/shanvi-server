// 1. Import Core Dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables from a .env file into process.env

const productionHouseRoutes = require('./src/routes/productionHouseRoutes');
const partyRoutes = require('./src/routes/partyRoutes');
const factoryRoutes = require('./src/routes/factoryRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const palletRoutes = require('./src/routes/palletRoutes'); // <-- ADD THIS LINE
const associateCompanyRoutes = require('./src/routes/associateCompanyRoutes'); // <-- ADD THIS



const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors({
    origin: true, // Reflects the request origin. For production, you might want to restrict this to your frontend's URL.
    credentials: true
}));

app.use(express.json());

app.use('/api/production-house', productionHouseRoutes);
app.use('/api/parties', partyRoutes); // Using plural form is a common REST convention
app.use('/api/factories', factoryRoutes); // Using plural form
app.use('/api/orders', orderRoutes); // Using plural form
app.use('/api/pallets', palletRoutes); // <-- ADD THIS LINE
app.use('/api/associate-companies', associateCompanyRoutes); // <-- ADD THIS



if (!MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined in the .env file.');
    process.exit(1); // Exit the application with an error code
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB.'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('Welcome to the API. The server is running correctly.');
});


app.listen(PORT, () => {
    console.log(`🚀 Server is running and listening on port ${PORT}`);
});
