const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
    },
    categoryCode: {
        type: String,
        required: true,
    },
});

const Categories = mongoose.model('Categories', CategorySchema);

module.exports = Categories;