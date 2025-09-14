const mongoose = require("mongoose");

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("The database server is now connected");
    } catch (error) { 
        console.error(error);
    }
}

main();