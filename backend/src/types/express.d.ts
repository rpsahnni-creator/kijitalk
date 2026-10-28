import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    /** Raw request body bytes, captured by the global json() verify hook — needed for webhook signature checks. */
    rawBody?: Buffer;
  }
}
