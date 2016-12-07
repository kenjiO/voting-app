'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Poll = new Schema({
    owner: String,
    name: {type: String, unique: true},
    choices: [String],
    results: [Number]
});


module.exports = mongoose.model('Poll', Poll);
