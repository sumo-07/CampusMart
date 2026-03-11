const axios = require("axios");

const testCartAdd = async () => {
    try {
        // 1. Login
        console.log("Logging in...");
        const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
            email: "testuser99@example.com",
            password: "pass123"
        });
        
        const token = loginRes.data.token;
        console.log("Logged in! Token obtained.");

        // 2. Add to cart
        console.log("Adding product to cart...");
        const addRes = await axios.post("http://localhost:5000/api/cart/add", {
            productId: "1",
            title: "Essence Mascara",
            price: 9.99,
            thumbnail: "https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/thumbnail.png",
            quantity: 1
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Success! Response:", addRes.data);
    } catch (err) {
        if (err.response) {
            console.error("Backend Error Response:", err.response.data);
        } else {
            console.error("Request Failed:", err.message);
        }
    }
};

testCartAdd();
