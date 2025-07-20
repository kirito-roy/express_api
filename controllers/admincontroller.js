const products = require('../models/products');

exports.dataentry = async (req, res) => {
    try {
        const {
            productCategory,
            productDescription,
            productName,
            productPrice,
            productImage
        } = req.body;

        // Validate required fields
        if (!productCategory || !productDescription || !productName || !productPrice || !productImage) {
            return res.status(400).json({
                error: "Missing 'productCategory', 'productDescription', 'productName', 'productPrice', or 'productImage'"
            });
        }

        // Convert base64 image to Buffer
        let imageBuffer;
        if (productImage.startsWith('data:')) {
            const base64Data = productImage.split(',')[1]; // Remove "data:image/jpeg;base64," prefix
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            return res.status(400).json({ error: 'Invalid image format' });
        }

        const product = new products({
            productCategory,
            productDescription,
            productName,
            productPrice,
            productImage: imageBuffer, // Store as Buffer
        });

        const savedProduct = await product.save();

        return res.status(201).json({
            message: "Product added successfully",
            status: "success",
            productId: savedProduct._id,
        });

    } catch (error) {
        console.error('❌ Error processing request:', error);
        return res.status(500).json({
            error: 'Internal Server Error in dataentry',
            details: error.message
        });
    }
};

exports.getproducts = async (req, res) => {
    try {
        const results = await products.find();

        if (!results.length) {
            return res.status(404).json({ error: "No products found", status: "failed" });
        }

        return res.status(200).json({
            result: results.map(product => ({
                ...product.toObject(),
                productImage: `data:image/jpeg;base64,${product.productImage.toString('base64')}` // Send base64 back
            })),
            status: "success"
        });

    } catch (error) {
        console.error('❌ Error fetching products:', error);
        return res.status(500).json({
            error: 'Internal Server Error in getproducts',
            details: error.message
        });
    }
};
