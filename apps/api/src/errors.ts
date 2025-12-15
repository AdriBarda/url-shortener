export class AppError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message)
    this.name = this.constructor.name
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
