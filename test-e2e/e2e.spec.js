const {createBluetooth} = require('..')

test('get adapters', async () => {
  const {bluetooth, destroy} = createBluetooth()

  const adapters = await bluetooth.adapters()

  expect(adapters).toBeInstanceOf(Array)

  destroy()
})

