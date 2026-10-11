export class OpenMailError extends Error { constructor(public readonly code: string, message: string, public readonly status = 400, public readonly retryable = false) { super(message); this.name = 'OpenMailError'; } }
export class CapabilityError extends OpenMailError { constructor(capability: string) { super('CAPABILITY_UNSUPPORTED', `Provider does not support ${capability}`, 422); } }
export class AuthorizationError extends OpenMailError { constructor(message = 'Access denied') { super('FORBIDDEN', message, 403); } }
