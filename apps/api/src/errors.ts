export class AppError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message)
    this.name = this.constructor.name

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string) {
    super(message, 503)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Short URL not found') {
    super(message, 404)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class GoneError extends AppError {
  constructor(message = 'Short URL has expired') {
    super(message, 410)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
