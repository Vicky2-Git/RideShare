// --- Backend: server.js ---
// This is the complete and corrected backend server file for your RideShare app,
// now with real Google Cloud Vision API integration.

// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const vision = require('@google-cloud/vision'); // New import for Google Cloud Vision

// Import new models
const ProviderDetails = require('./models/ProviderDetails');
const RiderDetails = require('./models/RiderDetails');
const Ride = require('./models/Ride');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit to handle large image data

// --- MongoDB Connection ---
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Atlas connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- User Model (Mongoose Schema) ---
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    age: { type: Number, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    role: { type: String, enum: ['rider', 'provider'], default: 'rider' },
    createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', UserSchema);

// --- JWT Secret ---
const JWT_SECRET = process.env.JWT_SECRET;

// --- Dummy Data for Verification (Simulating Parivahan API, etc.) ---
const dummyVerificationData = {
    rc: {
        'DL12AB1234': { isValid: true, ownerName: 'John Doe' },
        'UP56CD5678': { isValid: false, ownerName: 'Jane Smith' },
    },
    insurance: {
        'INS987654321': { isValid: true, policyHolder: 'John Doe' },
        'INS123456789': { isValid: false, policyHolder: 'Jane Smith' },
    },
    license: {
        'DL9876543210': { isValid: true, name: 'John Doe', dob: '1990-05-15', validity: '2030-05-15' },
        'DL0123456789': { isValid: false, name: 'Jane Smith', dob: '1985-11-20', validity: '2020-11-20' },
    },
    aadhar: {
        '123456789012': { isValid: true, name: 'John Doe' },
        '987654321098': { isValid: true, name: 'Jane Smith' },
        '111122223333': { isValid: false, name: 'Fake User' },
    }
};

// --- Google Cloud Vision API Client ---
// IMPORTANT: You MUST set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// to the path of your downloaded service account key file.
// Or, if you prefer to use the API key directly, you can do this:
const visionClient = new vision.ImageAnnotatorClient({
    auth: {
        apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY // This requires your API key in the .env file
    }
});

// --- OCR Service Function (Real Google Cloud Vision API Call) ---
async function ocrService(base64Image) {
    try {
        const [result] = await visionClient.documentTextDetection({
            image: {
                content: base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
            }
        });
        const fullText = result.fullTextAnnotation.text;
        console.log('OCR extracted text:', fullText);
        
        // This is a simple regex parsing. You may need to refine this for your specific document layouts.
        const extractedData = {
            name: /Name: (.+?)\n/.exec(fullText)?.[1] || 'OCR Name Not Found',
            licenseNumber: /DL Number: (.+?)\n/.exec(fullText)?.[1] || 'OCR License Not Found',
            dob: /DOB: (.+?)\n/.exec(fullText)?.[1] || 'OCR DOB Not Found',
            validity: /Valid Till: (.+?)\n/.exec(fullText)?.[1] || 'OCR Validity Not Found',
        };

        return extractedData;
    } catch (error) {
        console.error('OCR API call failed:', error);
        throw new Error('OCR API call failed.');
    }
}

// --- Routes ---
// (Your existing routes for /api/auth/register, /api/auth/login, etc. go here)
// ... (The rest of your server.js code) ...

// 1. User Registration
app.post(
    '/api/auth/register',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
        check('password', 'Password must contain at least one uppercase letter, one lowercase letter, and one number').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/),
        check('gender', 'Gender is required and must be Male, Female, or Other').isIn(['Male', 'Female', 'Other']),
        check('age', 'Age is required and must be a number between 18 and 100').isInt({ min: 18, max: 100 }),
        check('mobileNumber', 'Mobile number is required and must be 10 digits').isLength({ min: 10, max: 10 }).isNumeric(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, email, password, gender, age, mobileNumber } = req.body;
        try {
            let user = await User.findOne({ $or: [{ email }, { mobileNumber }] });
            if (user) {
                return res.status(400).json({ message: 'User with this email or mobile number already exists.' });
            }
            user = new User({ name, email, password, gender, age, mobileNumber });
            await user.save();
            const payload = {
                user: { id: user.id, role: user.role }
            };
            jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' },
                (err, token) => {
                    if (err) {
                        console.error('JWT sign error:', err.message);
                        return res.status(500).json({ message: 'Token generation failed.' });
                    }
                    res.status(201).json({ message: 'User registered successfully', token });
                }
            );
        } catch (err) {
            console.error('Registration error:', err.message);
            res.status(500).json({ message: 'Server error during registration.' });
        }
    }
);

// 2. User Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const payload = {
            user: { id: user.id, role: user.role }
        };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error('JWT sign error:', err.message);
                    return res.status(500).json({ message: 'Token generation failed.' });
                }
                res.json({ message: 'Login successful', token, role: user.role });
            }
        );
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// 3. Middleware to verify JWT token (for protected routes)
function auth(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
}

// 4. Get User Profile (Protected Route Example)
app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error('Get profile error:', err.message);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
});

// 5. Update User Role
app.put('/api/auth/role', auth, async (req, res) => {
    const { role } = req.body;
    if (!['rider', 'provider'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified. Must be "rider" or "provider".' });
    }
    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        user.role = role;
        await user.save();
        res.json({ message: `Role updated to ${role}`, newRole: user.role });
    } catch (err) {
        console.error('Update role error:', err.message);
        res.status(500).json({ message: 'Server error updating role.' });
    }
});

// --- Provider Details Routes ---

app.post('/api/provider/details', auth, async (req, res) => {
    const {
        vehicleCategory, vehicleNumber, rcNumber, insuranceNumber, licenseNumber, aadharNumber,
        vehicleType, vehiclePhotoUrl, rcPhotoUrl, insurancePhotoUrl,
        licensePhotoUrl, aadharPhotoUrl, isPreviouslyUsedVehicle
    } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'provider') {
        return res.status(403).json({ message: 'Access denied. Only providers can add details.' });
    }
    if (!vehicleCategory || !['Car', 'Bike'].includes(vehicleCategory)) {
        return res.status(400).json({ message: 'Vehicle category is required and must be "Car" or "Bike".' });
    }
    if (vehicleCategory === 'Car' && !vehicleType) {
        return res.status(400).json({ message: 'Vehicle type is required for cars.' });
    }
    if (!insuranceNumber) {
        return res.status(400).json({ message: 'Insurance number is required.' });
    }
    try {
        const rcVerified = dummyVerificationData.rc[rcNumber]?.isValid || false;
        const insuranceVerified = dummyVerificationData.insurance[insuranceNumber]?.isValid || false;
        const aadharVerified = dummyVerificationData.aadhar[aadharNumber]?.isValid || false;
        let licenseVerified = false;
        let ocrExtractedName = null;
        let ocrExtractedLicenseNumber = null;
        let ocrExtractedDob = null;
        let ocrExtractedValidity = null;
        if (licensePhotoUrl) {
            try {
                const ocrResult = await ocrService(licensePhotoUrl); // Using the real OCR service
                ocrExtractedName = ocrResult.name;
                ocrExtractedLicenseNumber = ocrResult.licenseNumber;
                ocrExtractedDob = ocrResult.dob;
                ocrExtractedValidity = ocrResult.validity;
                if (ocrExtractedName === user.name &&
                    ocrExtractedLicenseNumber === licenseNumber &&
                    dummyVerificationData.license[licenseNumber]?.isValid &&
                    dummyVerificationData.license[licenseNumber]?.name === user.name
                ) {
                    licenseVerified = true;
                }
            } catch (ocrError) {
                console.error('Error during OCR process:', ocrError);
                return res.status(500).json({ message: 'OCR verification failed. Please try again with a clearer image.' });
            }
        }
        const detailsFields = {
            user: req.user.id, vehicleCategory, vehicleNumber, rcNumber, insuranceNumber, licenseNumber, aadharNumber,
            vehicleType: vehicleCategory === 'Car' ? vehicleType : undefined, vehiclePhotoUrl, rcPhotoUrl, insurancePhotoUrl,
            licensePhotoUrl, aadharPhotoUrl, isPreviouslyUsedVehicle, rcVerified, insuranceVerified, licenseVerified, aadharVerified,
            ocrExtractedName, ocrExtractedLicenseNumber, ocrExtractedDob, ocrExtractedValidity
        };
        let providerDetails = await ProviderDetails.findOneAndUpdate({ user: req.user.id }, { $set: detailsFields }, { new: true, upsert: true });
        res.status(201).json({ message: 'Provider details updated successfully', providerDetails });
    } catch (err) {
        console.error('Provider details save/update error:', err.message);
        res.status(500).json({ message: 'Server error saving provider details.' });
    }
});

app.get('/api/provider/details', auth, async (req, res) => {
    try {
        const providerDetails = await ProviderDetails.findOne({ user: req.user.id });
        if (!providerDetails) {
            return res.status(404).json({ message: 'Provider details not found.' });
        }
        res.json(providerDetails);
    } catch (err) {
        console.error('Get provider details error:', err.message);
        res.status(500).json({ message: 'Server error fetching provider details.' });
    }
});

// --- Rider Details Routes ---

app.post('/api/rider/details', auth, async (req, res) => {
    const { aadharNumber, mobileNumber, aadharPhotoUrl } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'rider') {
        return res.status(403).json({ message: 'Access denied. Only riders can add details.' });
    }
    try {
        const aadharVerified = dummyVerificationData.aadhar[aadharNumber]?.isValid || false;
        const detailsFields = {
            user: req.user.id, aadharNumber, mobileNumber, aadharPhotoUrl, aadharVerified
        };
        let riderDetails = await RiderDetails.findOneAndUpdate(
            { user: req.user.id }, { $set: detailsFields }, { new: true, upsert: true }
        );
        if (!riderDetails) {
            riderDetails = new RiderDetails(detailsFields);
            await riderDetails.save();
        }
        res.status(201).json({ message: 'Rider details saved successfully', riderDetails });
    } catch (err) {
        console.error('Rider details save/update error:', err.message);
        res.status(500).json({ message: 'Server error saving rider details.' });
    }
});

app.get('/api/rider/details', auth, async (req, res) => {
    try {
        const riderDetails = await RiderDetails.findOne({ user: req.user.id });
        if (!riderDetails) {
            return res.status(404).json({ message: 'Rider details not found.' });
        }
        res.json(riderDetails);
    } catch (err) {
        console.error('Get rider details error:', err.message);
        res.status(500).json({ message: 'Server error fetching rider details.' });
    }
});

// Start the server
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));
