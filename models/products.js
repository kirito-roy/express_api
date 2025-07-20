const mongoose = require('mongoose');

// CREATE TABLE products (     id INTEGER PRIMARY KEY AUTOINCREMENT,     productCategory TEXT NOT NULL,     productDescription TEXT NOT NULL,     productName TEXT NOT NULL,     productPrice REAL NOT NULL,     productImage BLOB )

const productsSchema = new mongoose.Schema({
    productCategory: {
        type: String,
        required: true,
    },
    productDescription: {
        type: String,
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    productPrice: {
        type: Number,
        required: true,
    },
    productImage: {
        type: Buffer,
        required: true,
    },
});

module.exports = mongoose.model('Product', productsSchema);

