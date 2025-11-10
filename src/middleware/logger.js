import morgan from "morgan";

export const logger = morgan((tokens, req, res) => {
  const time = new Date().toISOString();
  return `[${time}] ${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)} ${tokens['response-time'](req, res)} ms`;
});
