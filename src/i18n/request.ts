import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Hardcoded to 'ar' for now based on the fact that this is an Arabic-first system
  const locale = 'ar';
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
