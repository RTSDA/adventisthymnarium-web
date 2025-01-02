import { dev } from '$app/environment';
import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = ({ error, event }) => {
  if (dev) {
    console.error('Client-side error:', error);
  }
}; 