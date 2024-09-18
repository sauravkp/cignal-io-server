const Logger = require("../Logger");
const EnhancedEventEmitter = require("../EnhancedEventEmitter");
const Message = require("../Message");

const logger = new Logger("WebSocketTransport");

class WebSocketTransport extends EnhancedEventEmitter {
  constructor(connection) {
    super(logger);

    logger.debug(
      "constructor() WebSocketTransport Server with connectionId:%s",
      connection.id
    );

    // Closed flag.
    // @type {Boolean}
    this._closed = false;

    // WebSocket cnnection instance.
    // @type {WebSocket-Node.WebSocketConnection}
    this._connection = connection;

    // Socket instance.
    // @type {net.Socket}
    // this._socket = connection.socket;

    // Handle connection.
    this._handleConnection();
  }

  get closed() {
    return this._closed;
  }

  close() {
    if (this._closed) return;

    logger.debug("close() [conn:%s]", this);

    // Don't wait for the WebSocket 'close' event, do it now.
    this._closed = true;
    this.safeEmit("close");

    try {
      this._connection.disconnect();
    } catch (error) {
      logger.error("close() | error closing the connection: %s", error);
    }
  }

  async send(message) {
    if (this._closed) {
      // logger.error("Transport already closed!:%O", message);
      return;
    }

    try {
      this._connection.send(JSON.stringify(message));
    } catch (error) {
      logger.warn("send() failed:%o", error);

      throw error;
    }
  }

  _handleConnection() {
    this._connection.on("error", () => {
      logger.error(
        `Connection with sessionId {sessionId: ${this._connection.id}} disconnected!`
      );
      this.emit("error");
    });

    this._connection.on("disconnect", (reason) => {
      logger.error(
        `Connection disconnected due to reason ${reason} {sessionId: ${this._connection.id}}`
      );
      if (
        reason === "ping timeout" 
        // ||
        // reason === "transport close" ||
        // reason === "server namespace disconnect"
      )
        this.emit("disconnect");
      else this.emit("close");
    });

    this._connection.on("reconnected", () => {
      this.emit("reconnected");
    });

    this._connection.on("message", (raw) => {
      const message = Message.parse(raw);
      // logger.debug("parsed message is:%s", message);
      if (!message) return;

      if (this.listenerCount("message") === 0) {
        logger.error(
          'no listeners for "message" event, ignoring received message'
        );

        return;
      }

      // Emit 'message' event.
      this.safeEmit("message", message);
    });
  }
}

module.exports = WebSocketTransport;
