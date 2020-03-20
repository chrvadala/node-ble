module.exports = {
  plugins: [
    '@babel/plugin-proposal-class-properties',
    [
      '@babel/plugin-proposal-decorators',
      {
        decoratorsBeforeExport: true,
        legacy: false
      }
    ]
  ]
}
