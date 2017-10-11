const tests = [
  {
    description: 'should reject self signed cert (GET)',
    expected: 'rejected: {"status":-1,"error":"cancelled"}',
    func: function() { cordova.plugin.http.get('https://self-signed.badssl.com/', {}, {}, app.resolve, app.reject); }
  },{
    description: 'should reject self signed cert (PUT)',
    expected: 'rejected: {"status":-1,"error":"cancelled"}',
    func: function() { cordova.plugin.http.put('https://self-signed.badssl.com/', { test: 'testString' }, {}, app.resolve, app.reject); }
  },{
    description: 'should reject self signed cert (POST)',
    expected: 'rejected: {"status":-1,"error":"cancelled"}',
    func: function() { cordova.plugin.http.post('https://self-signed.badssl.com/', { test: 'testString' }, {}, app.resolve, app.reject); }
  },{
    description: 'should reject self signed cert (PATCH)',
    expected: 'rejected: {"status":-1,"error":"cancelled"}',
    func: function() { cordova.plugin.http.patch('https://self-signed.badssl.com/', { test: 'testString' }, {}, app.resolve, app.reject); }
  },{
    description: 'should reject self signed cert (DELETE)',
    expected: 'rejected: {"status":-1,"error":"cancelled"}',
    func: function() { cordova.plugin.http.delete('https://self-signed.badssl.com/', {}, {}, app.resolve, app.reject); }
  }
];

if (module && module.exports) {
  module.exports = tests;
}
