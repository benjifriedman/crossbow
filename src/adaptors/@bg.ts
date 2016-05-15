import {CommandTrigger} from "../command.run";
import {getArgs, runCommand, teardown, getEnv} from './@npm';
import {Task} from "../task.resolve.d";
import {envifyObject, getCBEnv} from "../task.utils";
const debug = require('debug')('cb:@bg');
const merge = require('lodash.merge');

module.exports = function (task: Task, trigger: CommandTrigger) {

    return function (opts, ctx, done) {

        const args   = getArgs(task, trigger);
        const npmEnv = getEnv(process.env, trigger.config);
        const cbEnv  = getCBEnv(trigger);
        const env    = merge({}, npmEnv, cbEnv, task.env, process.env);
        const stdio  = trigger.config.suppressOutput
            ? ['pipe', 'pipe', 'pipe']
            : 'inherit';

        debug(`running %s`, args.cmd);

        const emitter = runCommand(args.cmd, {
            cwd: trigger.config.cwd,
            env: env,
            stdio: stdio
        });

        emitter.on('close', function (code) {
            teardown(emitter);
        }).on('error', function (err) {
            done(err);
        });

        done(null, function tearDownBgAdaptor() {
            teardown(emitter);
        });
    };
};
