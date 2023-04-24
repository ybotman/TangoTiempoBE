const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    CategoryName: {
        type: String,
        required: true,
    },
    CategoryCode: {
        type: String,
        required: true,
    },
});

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
