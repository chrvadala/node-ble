const {Variant, interface: {Interface, property, method, ACCESS_READWRITE}} = require('dbus-next');

class TestInterface extends Interface {
  @property({signature: 's', access: ACCESS_READWRITE})
  SimpleProperty = 'bar';

  _VirtualProperty = 'foo'

  @property({signature: 's'})
  get VirtualProperty() {
    return this._VirtualProperty;
  }

  set VirtualProperty(value) {
    this._VirtualProperty = value;

    Interface.emitPropertiesChanged(this, {
      VirtualProperty: value
    })
  }

  @method({inSignature: 's', outSignature: 's'})
  Echo(what) {
    return `>>${what}`;
  }
}

module.exports = TestInterface
