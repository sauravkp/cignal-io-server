// const websocket = require('websocket');
const { Server } = require("socket.io");
const Logger = require("../Logger");
const EnhancedEventEmitter = require("../EnhancedEventEmitter");
const WebSocketTransport = require("./WebSocketTransport");

const logger = new Logger("WebSocketServer");

class WebSocketServer extends EnhancedEventEmitter {
  /**
   * @param {http.Server} httpServer - Node HTTP/HTTPS compatible server.
   * @param {Object} [options] - Options for WebSocket-Node.WebSocketServer.
   *
   * @emits {info: Object, accept: Function, reject: Function} connectionrequest
   */
  constructor(httpServer, options) {
    super(logger);

    logger.debug("constructor() [option:%o]", options);

    const pingInterval = 10000;
    const pingTimeout = 20000;

    // Create a socket.io server
    const serverOptions = {
      pingInterval: options.pingInterval || pingInterval,
      pingTimeout: options.pingTimeout || pingTimeout,
    };

    // Run a WebSocket server instance.
    // @type {WebSocket-Node.WebSocketServer}
    this._wsServer = new Server(httpServer, serverOptions);

    this._wsServer.on("connection", (socket) => {
      this._onRequest(socket);
    });
  }

  /**
   * Stop listening for protoo WebSocket connections. This method does NOT
   * close the HTTP/HTTPS server.
   */
  stop() {
    logger.debug("stop()");

    // Don't close the given http.Server|https.Server but just unmount the
    // WebSocket server.
    this._wsServer.close();
  }

  _onRequest(socket) {
    logger.debug(
      "New conection [socketId:%s, Data:%O]",
      socket.id,
      socket.handshake
    );

    try {
      // Emit 'connectionrequest' event.
      this.emit(
        "connectionrequest",
        // Connection data.
        socket,
        () => {
          // Create a new Protoo WebSocket transport.
          const transport = new WebSocketTransport(socket);

          logger.debug("_onRequest() | accept() called");

          // Return the transport.
          return transport;
        }
      );
    } catch (error) {
      logger.error("Error while accepting socket connection:", error);
    }
  }
}

module.exports = WebSocketServer;
