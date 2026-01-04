import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.nossumus.vinvin',
  appName: 'vinvin',
  webDir: 'out', // not used when server.url is set, but ok to keep
  server: {
    url: 'https://vinvin.io',
    cleartext: false,
  },
};

export default config;