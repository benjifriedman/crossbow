import {Task} from "./task.resolve.d";

const assign = require('object-assign');
const qs = require('qs');
const flagRegex = /(.+?)@(.+)?$/;
export const removeNewlines = (x: string) => x.replace(/\n|\r/g, '').trim();
const e = (x) => x
    .replace(/\n|\r/g, '')
    .replace(/\{/g, '\\\{')
    .replace(/}/g, '\\\}');

export interface IncomingTask {
    baseTaskName: string
    subTasks: string[]
    rawInput: string
    taskName: string
    flags: {}
    cbflags: string[]
    modules?: string[]
    tasks?: Task[]
    query: any
}

export interface OutgoingTask extends IncomingTask {
    runMode: string
    tasks: Task[]
}

export function preprocessTask(taskName: string): OutgoingTask {

    /**
     * Split any end cbflags from the main task name
     * @type {SplitTaskAndFlags}
     */
    var split      = getSplitFlags(taskName);

    /**
     * Split the incoming taskname on colons
     *  eg: sass:site:dev
     *  ->  ['sass', 'site', 'dev']
     * @type {Array}
     */
    const splitTask = split.taskName.split(':');

    /**
     * Take the first (or the only) item as the base task name
     *  eg: uglify:*
     *  ->  'uglify'
     * @type {string}
     */
    const baseTaskName = splitTask[0];
    const subTasks     = splitTask.slice(1);

    /**
     * Create the base task
     * @type {IncomingTask}
     */
    const incomingTask = <IncomingTask>{
        cbflags: split.cbflags,
        query: split.query,
        flags: split.flags,
        baseTaskName,
        subTasks,
        taskName: baseTaskName,
        rawInput: taskName,
        tasks: []
    };

    /**
     * Now pass it off to allow any flags to applied
     */
    return processFlags(incomingTask);
}

export interface SplitTaskAndFlags {
    taskName: string
    cbflags: string[]
    flags: {}
    query: any
}

/**
 * @param taskName
 * @returns {any}
 */
function getSplitFlags (taskName: string): SplitTaskAndFlags {

    /**
     * Split up the task name from any flags/queries/cbflags etc
     * @type {{baseName: string, flags: {}}}
     */
    const baseNameAndFlags = getBaseNameAndFlags(taskName);

    /**
     * Split tasks based on whether or not they have flags
     *    eg: crossbow run '@npm run webpack@p'
     *    ->  taskName: '@npm run webpack'
     *    ->  cbflags: ['p']
     * @type {RegExpMatchArray}
     */
    const splitCBFlags = baseNameAndFlags.baseName.match(flagRegex);

    /**
     * If splitFlags is falsey, there was no flag so return
     * an empty array and the full task name
     */
    if (!splitCBFlags) {
        const splitQuery = baseNameAndFlags.baseName.split('?');
        const query = splitQuery.length > 1
            ?  qs.parse(splitQuery[1])
            : {};
        return {taskName: splitQuery[0], query, cbflags:[], flags: baseNameAndFlags.flags};
    }

    /**
     * At this point, there was at LEAST an @ at the end of the task name
     * @type {string}
     */
    const base = splitCBFlags[1];
    const splitQuery = base.split('?');
    const query = splitQuery.length > 1
        ?  qs.parse(splitQuery[1])
        : {};

    /**
     * If the 3rd item in the regex match is undefined, it means
     * the @ was used at the end of the task name, but a value was not given.
     * In that case we return an empty string to allow the error collection
     * to kick in later
     * @type {string[]}
     */
    const cbflags = splitCBFlags[2] === undefined
        ? ['']
        /**
         * Default case is where there are chars after the @, so we split them up
         *   eg: crossbow run '@npm run webpack@pas'
         *   ->  flags: ['p', 'a', 's']
         */
        : splitCBFlags[2].split('');
    return {
        taskName: splitQuery[0],
        query,
        cbflags,
        flags: baseNameAndFlags.flags
    };
}

/**
 * Apply any transformations to options based on
 * CB flags
 * @param incoming
 * @returns {any}
 */
function processFlags (incoming: IncomingTask): OutgoingTask {

    const runMode = incoming.cbflags.indexOf('p') > -1
        ? 'parallel'
        : 'series';

    return assign({}, incoming, {
        runMode
    });
}

/**
 * Strip any underscore commands from parsed args
 * @param obj
 * @returns {{}}
 */
function withoutCommand (obj: {}) {
    if (!Object.keys(obj).length) {
        return {};
    }
    return Object.keys(obj).reduce(function (acc, key) {
        if (key !== "_") {
            acc[key] = obj[key];
        }
    	return acc;
    }, {});
}

/**
 * Split basename + opts
 * @param taskName
 * @returns {{baseName: any, flags: {}}}
 */
function getBaseNameAndFlags (taskName: string): {baseName: string, flags: {}} {
    const splitFlags = taskName.trim().split(/^(.+?) /);
    var baseName;
    var flags = {};
    if (splitFlags.length === 1) {
        baseName = splitFlags[0];
    } else {
        baseName = splitFlags[1];
        if (splitFlags.length === 3) {
            const mini = require('yargs-parser');
            flags = withoutCommand(mini(splitFlags[2]));
        }
    }
    return {baseName, flags};
}
