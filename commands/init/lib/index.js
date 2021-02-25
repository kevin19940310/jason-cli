'use strict';
const Command = require('@jason-cli/command')
const log = require('@jason-cli/log')
class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._argv[1].force
        log.verbose('projectName:',this.projectName);
        log.verbose('force:',this.force)
    }

    exec() {
        console.log('exec');
    }
}

function init (argv) {
    return new InitCommand(argv)
}

module.exports = init

module.exports.InitCommand = InitCommand;