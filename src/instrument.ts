import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.npm_package_version,
  tracesSampleRate: 1.0,
  ignoreTransactions: [],
  beforeSendTransaction(event) {
    return event;
  },
  beforeSend(event) {
    return event;
  },
});
