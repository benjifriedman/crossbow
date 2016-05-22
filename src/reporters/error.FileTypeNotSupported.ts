import {FileTypeNotSupportedError} from "../task.errors.d";

module.exports = (error: FileTypeNotSupportedError, task) =>
    `{red:-} {bold:Description}: {cyan:'${error.externalTask.relative}'} Not Supported
  Crossbow does not {bold:currently} support files with the extension {yellow.bold:${error.externalTask.parsed.ext}}
  So running {yellow:${task.rawInput}} will not work I'm afraid :(
  If you would like support for this file type added, please contact us`;
