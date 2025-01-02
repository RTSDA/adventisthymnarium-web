import { error } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';

const requiredEnvVars = [
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ACCOUNT_ID'
] as const;

type EnvVars = {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ACCOUNT_ID: string;
};

function getEnvVars(): EnvVars {
  const missingVars = requiredEnvVars.filter(key => !privateEnv[key]);
  if (missingVars.length > 0) {
    throw error(500, `Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // After the check above, we know these exist
  const accessKey = privateEnv.R2_ACCESS_KEY_ID;
  const secretKey = privateEnv.R2_SECRET_ACCESS_KEY;
  const accountId = privateEnv.R2_ACCOUNT_ID;

  if (!accessKey || !secretKey || !accountId) {
    throw error(500, 'Required environment variables are undefined');
  }
  
  return {
    R2_ACCESS_KEY_ID: accessKey,
    R2_SECRET_ACCESS_KEY: secretKey,
    R2_ACCOUNT_ID: accountId
  };
}

export const env = getEnvVars(); 