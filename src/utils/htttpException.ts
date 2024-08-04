class HttpException extends Error {
  statusCode: number;
  message: string;

  constructor(statusCode: number, message: string) {
    super(message); // Pass the message to the Error constructor
    this.statusCode = statusCode;
    this.message = message;
    this.name = 'HttpException'; // Set the name property for improved error handling
  }
}

export default HttpException;
