require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const seedProducts = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected successfully.");

        console.log("Fetching products from DummyJSON...");
        const response = await fetch("https://dummyjson.com/products?limit=200");
        const data = await response.json();
        const products = data.products;

        console.log(`Fetched ${products.length} products. Mapping to local schema...`);
        
        const mappedProducts = products.map((p) => ({
            title: p.title,
            description: p.description,
            price: p.price,
            discountPercentage: p.discountPercentage,
            rating: p.rating,
            stock: p.stock,
            brand: p.brand || "Generic",
            category: p.category,
            thumbnail: p.thumbnail,
            images: p.images,
        }));

        console.log("Clearing existing products...");
        await Product.deleteMany();

        console.log("Inserting new products...");
        await Product.insertMany(mappedProducts);

        console.log("Seeding complete!");
        process.exit();
    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
};

seedProducts();
