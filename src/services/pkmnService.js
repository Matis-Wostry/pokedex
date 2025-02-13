const PkmnType = require("../models/PkmnType");

const getAllTypes = () => {
    return {
        data: PkmnType,
        count: PkmnType.length
    };
};

module.exports = { getAllTypes };