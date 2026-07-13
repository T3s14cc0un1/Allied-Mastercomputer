// pzRconService.js

import { Rcon } from 'rcon-client';
import { logger } from '../utils/logger.js';

const RCON_HOST = process.env.PZ_RCON_HOST;
const RCON_PORT = Number(process.env.PZ_RCON_PORT) || 27015;
const RCON_PASSWORD = process.env.PZ_RCON_PASSWORD;

const CONNECT_TIMEOUT_MS = 5000;

function isConfigured() {
  return Boolean(RCON_HOST && RCON_PASSWORD);
}

export async function sendRconCommand(command) {
  if (!isConfigured()) {
    throw new Error('PZ RCON is not configured. Set PZ_RCON_HOST, PZ_RCON_PORT, and PZ_RCON_PASSWORD in .env');
  }

  if (!command || typeof command !== 'string' || !command.trim()) {
    throw new Error('A non-empty command string is required');
  }

  let rcon;
  try {
    rcon = await Rcon.connect({
      host: RCON_HOST,
      port: RCON_PORT,
      password: RCON_PASSWORD,
      timeout: CONNECT_TIMEOUT_MS,
    });

    const response = await rcon.send(command.trim());

    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`PZ RCON command sent: "${command}" -> "${response}"`);
    }

    return response;
  } catch (error) {
    logger.error('PZ RCON command failed:', error);
    throw error;
  } finally {
    if (rcon) {
      try {
        await rcon.end();
      } catch (closeError) {
        logger.debug('Error closing PZ RCON connection:', closeError);
      }
    }
  }
}

export function isPzRconConfigured() {
  return isConfigured();
}