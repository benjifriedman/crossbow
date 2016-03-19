const Rx = require('rx');

import {Tasks} from "./task.resolve";
import {SequenceItem} from "./task.sequence.factories";
import {Runner} from "./runner";
import {CommandTrigger} from './command.run';
const debug = require('debug')('cb:task.runner');
const assign = require('object-assign');
import logger from './logger';
import handleReturn from './task.return.values';

export interface TaskRunner {
    tasks: Tasks
    sequence: SequenceItem[]
    runner: Runner
}

export interface TaskStats {
    startTime: number
    endTime: number
    duration: number
    started: boolean
    completed: boolean
    errors: Error[]
}

export interface TaskReport {
    item: SequenceItem
    stats: TaskStats
    type: string
}

/**
 * This creates a wrapper around the actual function that will be run.
 * This done to allow the before/after reporting to work as expected for consumers
 */
export function createObservableFromSequenceItem(item: SequenceItem, trigger: CommandTrigger) {

    return Rx.Observable.create(outerObserver => {

        const stats = getStartStats(new Date().getTime());
        
        let errored = false;

        debug(`> seqUID ${item.seqUID} started`);

        outerObserver.onNext(getTaskReport('start', item, stats));

        getInnerTaskRunnerAsObservable(item, trigger)
            .catch(function (e) {
                const errorReport = getTaskReport('error', item, getErrorStats(stats, e));
                debug(`x seqUID ${item.seqUID} errored`);
                outerObserver.onNext(errorReport);
                outerObserver.onError(e);
                return Rx.Observable.never();
            })
            .subscribe(function () {
                // todo: What to do with tasks that produce vales through given observer.onNext()?
            }, error => {
                // NEVER GUNNA GET HERE
            }, _ => {
                debug(`✔ seqUID ${item.seqUID} completed`);
                outerObserver.onNext(getTaskReport('end', item, getEndStats(stats)));
                outerObserver.onCompleted();
            });
    });
}

/**
 * Factory for TaskReports
 */
function getTaskReport(type: string, item: SequenceItem, stats: TaskStats): TaskReport {
    return {type, item, stats};
}

function getErrorStats (stats, e) {
    const now = new Date().getTime();
    return assign({}, stats, {
        endTime: now,
        duration: now - stats.startTime,
        completed: false,
        errors: [e]
    });
}

/**
 * Create a new stats object with startTime
 */
export function getStartStats (startTime: number): TaskStats {
    return {
        startTime,
        started: true,
        endTime: 0,
        duration: 0,
        completed: false,
        errors: []
    }
}

/**
 * Create a new stats object with completed/duration flags etc
 */
function getEndStats(stats: TaskStats) {
    const now = new Date().getTime();
    return assign({}, stats, {
        endTime: now,
        duration: now - stats.startTime,
        completed: true
    })
}

function getInnerTaskRunnerAsObservable (item, trigger) {
    return Rx.Observable.create(observer => {

        observer.done = function () {
            observer.onCompleted();
        };

        var output;

        try {
            output = item.factory(item.config, trigger, observer);
        } catch (e) {
            return observer.onError(e);
        }

        /**
         * If the task did return something, we can look at the
         * type of it's value to work out how to handle to complete the task
         */
        if (output !== undefined) {
            if (output.type) {
                if (output.type === 'child_process') {
                    debug('child process returned');
                    const child = output.child;
                    var single = new Rx.SingleAssignmentDisposable();
                    var dis = Rx.Disposable.create(function () {
                        if ((typeof output.child.raw.exitCode) !== 'number') {
                            debug('tearing down a child_process because exitCode is missing');
                            child.removeAllListeners('close');
                            child.kill('SIGINT');
                            child.on('close', function () {
                                debug('close method on child encountered');
                                single.dispose();
                            });
                        } else {
                            debug('child process already completed, not disposing');
                            single.dispose();
                        }
                    });
                    single.setDisposable(dis);
                    return single
                }
            }
            return handleReturn(output, observer);
        }

        /**
         * If the argument length is less than 3, it means the user
         * has not asked for access to the observer - which means
         * we can complete the task immediately
         */
        if (item.factory.length < 3) {
            return observer.onCompleted();
        }
    });
}
