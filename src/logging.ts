import { FastifyLoggerOptions, PinoLoggerOptions } from "fastify/types/logger";

export type LogOptions = {
  logLevel: string
  prettyPrintLogs: string
}

export function configureFastifyLogging(options: LogOptions): FastifyLoggerOptions & PinoLoggerOptions {
  return {
    level: options.logLevel,
    ...(
      options.prettyPrintLogs
        ? { transport: { target: 'pino-pretty' } }
        : {}
    )
  };
}
