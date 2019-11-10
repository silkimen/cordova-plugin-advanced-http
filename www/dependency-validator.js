module.exports = function init(FormData, console, messages) {
  var interface = {
    checkFormDataApi: checkFormDataApi,
    logWarnings: logWarnings,
  };

  return interface;

  function logWarnings() {
    if (!FormData) {
      console.warn(messages.MISSING_FORMDATA_API);
    } else if (!FormData.prototype || !FormData.prototype.entries) {
      console.warn(messages.MISSING_FORMDATA_ENTRIES_API);
    }
  }

  function checkFormDataApi() {
    if (!FormData || !FormData.prototype || !FormData.prototype.entries) {
      throw new Error(messages.MISSING_FORMDATA_ENTRIES_API);
    }
  }
};
