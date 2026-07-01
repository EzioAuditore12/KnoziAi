import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { env } from 'src/env';

Sentry.init({
  dsn: env.SENTRY_DSN,

  // Tag errors with the environment so you can filter them in Sentry
  environment: env.NODE_ENV,

  integrations: [
    // This enables CPU profiling to find slow functions in your app
    nodeProfilingIntegration(),

    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],

  // Enable Performance Tracing (tracks how long each request takes to process)
  // Note: 1.0 means 100% of transactions are recorded. In high-traffic prod, lower this!
  tracesSampleRate: 1.0,

  // Enable CPU Profiling (attaches a CPU profile to performance traces)
  profilesSampleRate: 1.0,

  // enableLogs: true, (This is not a valid Sentry option for sending events)
});

// To send a custom message/log to your Sentry dashboard, use captureMessage:
//Sentry.captureMessage('User triggered test log', 'info');
