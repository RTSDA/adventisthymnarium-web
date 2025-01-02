import { error } from '@sveltejs/kit';

const requiredEnvVars = ['VITE_R2_ACCESS_KEY_ID', 'VITE_R2_SECRET_ACCESS_KEY'] as const;

type EnvVars = {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
};

function getEnvVars(): EnvVars {
  const missingVars = requiredEnvVars.filter(key => !import.meta.env[key]);
  if (missingVars.length > 0) {
    throw error(500, `Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    R2_ACCESS_KEY_ID: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: import.meta.env.VITE_R2_SECRET_ACCESS_KEY
  };
}

export const env = getEnvVars(); 