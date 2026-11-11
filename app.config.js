/** Configuração dinâmica: nunca coloque sua chave pessoal do Google Maps no GitHub. */
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    ...(process.env.GOOGLE_MAPS_API_KEY ? [[
      'react-native-maps',
      { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY },
    ]] : []),
  ],
});
