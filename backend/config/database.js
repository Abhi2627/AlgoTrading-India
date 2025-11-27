const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connect();
    }

    async connect() {
        try {
            // Remove deprecated options for newer MongoDB versions
            await mongoose.connect('mongodb+srv://abhaydandge2000:Abhi%401226@cluster0.eb5gdiu.mongodb.net/algotrade');
            console.log('✅ MongoDB Atlas connected successfully');
        } catch (error) {
            console.error('❌ MongoDB Atlas connection error:', error.message);
            console.log('💡 Please check your Atlas cluster IP whitelist and network access');
            // Continue without database - use in-memory storage
        }
    }
}

module.exports = new Database();