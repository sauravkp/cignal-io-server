const { version } = require("../package.json");
const Room = require("./Room");

/**
 * Expose mediasoup version.
 *
 * @type {String}
 */
exports.version = version;

/**
 * Expose Room class.
 *
 * @type {Class}
 */
exports.Room = Room;
