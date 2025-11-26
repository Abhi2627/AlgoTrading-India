const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connect();
    }

    async connect() {
        try {
            // Remove deprecated options for newer MongoDB versions
            await mongoose.connect('mongodb+srv://abhaydandge2000:Abhi%401226@cluster0.eb5gdiu.mongodb.net/');
            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            console.log('💡 Please make sure MongoDB is running on localhost:27017');
            process.exit(1);
        }
    }
}

module.exports = new Database();