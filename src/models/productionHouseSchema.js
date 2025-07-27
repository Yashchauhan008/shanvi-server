const mongoose = require('mongoose');

const productionHouseSchema = new mongoose.Schema({
    productionHouseName: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    film_white: { type: Number, default: 0 },
    film_blue: { type: Number, default: 0 },
    patti_role: { type: Number, default: 0 },
    angle_board_24: { type: Number, default: 0 },
    angle_board_32: { type: Number, default: 0 },
    angle_board_36: { type: Number, default: 0 },
    angle_board_39: { type: Number, default: 0 },
    angle_board_48: { type: Number, default: 0 },
    cap_hit: { type: Number, default: 0 },
    cap_simple: { type: Number, default: 0 },
    firmshit: { type: Number, default: 0 },
    thermocol: { type: Number, default: 0 },
    mettle_angle: { type: Number, default: 0 },
    black_cover: { type: Number, default: 0 },
    packing_clip: { type: Number, default: 0 },
    patiya: { type: Number, default: 0 },
    plypatia: { type: Number, default: 0 },
}, {
    timestamps: true
});

module.exports = mongoose.models.ProductionHouse || mongoose.model("ProductionHouse", productionHouseSchema);
