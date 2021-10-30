function getTestDevice () {
  const TEST_DEVICE = process.env.TEST_DEVICE
  if (!TEST_DEVICE) {
    console.error('TEST_DEVICE environment variable not found')
    process.exit(1)
  }

  return TEST_DEVICE
}

module.exports = {
  getTestDevice
}
