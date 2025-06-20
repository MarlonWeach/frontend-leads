import pino from 'pino';

// Configuração do logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // O transport do pino-pretty causa instabilidade no Next.js.
  // Removido para garantir a estabilidade do servidor.
  // transport:
  //   process.env.NODE_ENV !== 'production'
  //     ? {
  //         target: 'pino-pretty',
  //         options: {
  //           colorize: true,
  //         },
  //       }
  //     : undefined,
});

export { logger };
export default logger; 