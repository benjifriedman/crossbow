#!/usr/bin/env node
import {RunComplete} from "./command.run.execute";
import {TasksCommandComplete} from "./command.tasks";
import cli from "./cli";
import {handleIncoming} from "./index";
import logger from "./logger";
import Rx = require('rx');
import * as reports from "./reporter.resolve";
import {PostCLIParse} from "./cli";
import {prepareInput} from "./index";
import {DocsCommandOutput, DocsFileOutput} from "./command.docs";
import * as file from "./file.utils";

const parsed = cli(process.argv.slice(2));

const cliOutputObserver = new Rx.Subject<reports.OutgoingReport>();
cliOutputObserver.subscribe(function (report) {
    report.data.forEach(function (x) {
        logger.info(x);
    });
});

if (parsed.execute) {
    runFromCli(parsed, cliOutputObserver);
}

function runFromCli (parsed: PostCLIParse, cliOutputObserver): void {

    const prepared = prepareInput(parsed.cli, null, cliOutputObserver);

    /**
     * Any errors found on input preparation
     * will be sent to the output observer and
     * requires no further work other than to exit
     * with a non-zero code
     */
    if (prepared.errors.length) {
        return process.exit(1);
    }

    if (parsed.cli.command === 'run') {
        handleIncoming<RunComplete>(prepared)
            .subscribe(require('./command.run.post-execution').postCliExecution);
    }

    if (parsed.cli.command === 'tasks' || parsed.cli.command === 'ls') {
        const out = handleIncoming<TasksCommandComplete>(prepared);
        if (out && out.subscribe && typeof out.subscribe === 'function') {
            out.subscribe();
        }
    }

    if (parsed.cli.command === 'docs') {
        handleIncoming<DocsCommandOutput>(prepared)
            .subscribe(x => {
                if (x.errors.length === 0) {
                    x.output.forEach(function (outputItem: DocsFileOutput) {
                        file.writeFileToDisk(outputItem.file, outputItem.content);
                    });
                }
            })
    }
}
