const Product = require("../models/Product");

const DUMMY_JSON_URLS = [
    "https://dummyjson.com/products?limit=100&skip=0",
    "https://dummyjson.com/products?limit=100&skip=100",
];

const fetchWithRetry = async (url, maxRetries = 3, initialBackoffMs = 1000) => {
    let backoff = initialBackoffMs;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout per attempt

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error: status ${response.status}`);
            }

            const data = await response.json();
            if (Array.isArray(data.products)) {
                return data.products;
            }
            throw new Error("Invalid response format from DummyJSON");
        } catch (error) {
            console.warn(`[Seeder] Attempt ${attempt}/${maxRetries} failed for ${url}: ${error.message}`);
            if (attempt === maxRetries) {
                throw new Error(`Failed to fetch from ${url} after ${maxRetries} attempts: ${error.message}`);
            }
            console.log(`[Seeder] Retrying in ${backoff / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, backoff));
            backoff *= 2; // exponential backoff
        }
    }
};

const syncCatalog = async (options = {}) => {
    const isClean = !!options.clean;

    console.log("[Seeder] Starting catalog synchronization from DummyJSON...");

    // Fetch batches in smaller chunks to avoid Cloudflare/proxy timeouts
    const batch1 = await fetchWithRetry(DUMMY_JSON_URLS[0]);
    const batch2 = await fetchWithRetry(DUMMY_JSON_URLS[1]);
    const allProducts = [...batch1, ...batch2];

    console.log(`[Seeder] Fetched ${allProducts.length} products total.`);

    const mappedProducts = allProducts.map((p) => ({
        title: p.title,
        description: p.description,
        price: Number(p.price) || 0,
        discountPercentage: Number(p.discountPercentage) || 0,
        rating: Number(p.rating) || 0,
        stock: p.stock !== undefined ? Number(p.stock) : 20,
        brand: p.brand || "Generic",
        category: p.category || "all",
        thumbnail: p.thumbnail,
        images: Array.isArray(p.images) ? p.images : [p.thumbnail].filter(Boolean),
    }));

    if (isClean) {
        console.warn("[Seeder] Clean mode enabled: wiping existing product collection...");
        const deleteResult = await Product.deleteMany({});
        const inserted = await Product.insertMany(mappedProducts);
        return {
            mode: "clean",
            deletedCount: deleteResult.deletedCount,
            insertedCount: inserted.length,
            totalCount: await Product.countDocuments(),
        };
    } else {
        console.log("[Seeder] Safe upsert mode: updating existing and inserting new products without changing IDs...");
        const ops = mappedProducts.map((p) => ({
            updateOne: {
                filter: { title: p.title },
                update: { $set: p },
                upsert: true,
            },
        }));

        const result = await Product.bulkWrite(ops);
        const totalCount = await Product.countDocuments();
        return {
            mode: "upsert",
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
            totalCount,
        };
    }
};

module.exports = {
    syncCatalog,
};
