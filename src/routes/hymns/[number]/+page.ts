import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  // Ensure the number is a valid string
  const number = params.number?.trim();
  if (!number) {
    throw new Error('Invalid hymn number');
  }

  return {
    number
  };
}; 