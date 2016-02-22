#!/usr/bin/env node
/// <reference path="../typings/main.d.ts" />
import runner = require('./command.run');
import {CrossbowConfiguration, merge} from './config';
import {Map} from 'immutable';
import {TaskRunner} from './task.runner';
import {Task} from './task.resolve';
import {retrieveExternalInputFiles, createCrossbowTasksFromNpmScripts, ExternalFileInput} from './task.utils';
import {handleIncomingRunCommand} from "./command.run";
import treeCommand from "./command.tree";

const meow   = require('meow');
const assign = require('object-assign');
const _merge = require('lodash.merge');
const debug  = require('debug')('cb:init');

export interface Meow {
    input: string[]
    flags: any
    help?: string
}

function generateMeowInput (incoming: Meow|any) : Meow {
    return assign({input: [], flags:{}}, incoming || {});
}

export interface CrossbowInput {
    tasks: any
    watch: any
    config: any
    gruntfile?: string
    npmScripts: any
    mergedTasks: any
}

/**
 * `Input` is the object that is looked at to resolve tasks/config and
 * watchers
 * @param incoming
 * @param config
 * @returns {any}
 */
function generateInput (incoming: CrossbowInput|any, config: CrossbowConfiguration) : CrossbowInput {

    const npmScriptsAsCrossbowTasks = createCrossbowTasksFromNpmScripts(config.cwd);
    const mergedTasks = _merge({}, npmScriptsAsCrossbowTasks, incoming.tasks || {});

    return _merge({
        tasks: {},
        watch: {},
        config:{},
        mergedTasks,
        npmScripts: npmScriptsAsCrossbowTasks
    }, incoming || {});
}

const availableCommands = ['watch', 'run', 'tree'];

if (!module.parent) {
    const cli = <Meow>meow();
    handleIncoming(cli);
}

function handleIncoming (cli: Meow, input?: CrossbowInput|any): TaskRunner {
    cli = generateMeowInput(cli);
    const mergedConfig = merge(cli.flags);

    if (availableCommands.indexOf(cli.input[0]) === -1) {
        console.log('Show help here');
        return;
    }

    /**
     * If a user tried to load configuration from
     * an external file, load that now and set as the input
     */
    if (mergedConfig.config || input === undefined) {

        if (mergedConfig.config) {
            debug(`Config flag provided ${mergedConfig.config}`);
        } else {
            if (input === undefined) {
               debug('No input provided');
            }
        }

        const externalInputs = retrieveExternalInputFiles(mergedConfig);
        if (externalInputs.length) {
            debug(`Using external input from ${externalInputs[0].path}`);
            return processInput(cli, generateInput(externalInputs[0].input, mergedConfig), mergedConfig);
        }
    }

    return processInput(cli, generateInput(input, mergedConfig), mergedConfig);
}

/**
 * Now decide who should handle the current command
 */
function processInput(cli: Meow, input: CrossbowInput, config: CrossbowConfiguration) : any {

    if (cli.input[0] === 'run') {
        return handleIncomingRunCommand(cli, input, config);
    }
    if (cli.input[0] === 'tree') {
        return treeCommand(cli, input, config);
    }
}

export default handleIncoming;

module.exports = handleIncoming;

module.exports.getRunner = function getRunner (tasks: string[], input?: any) {
    return handleIncoming({
        input: ['run', ...tasks],
        flags: {handoff: true}
    }, input || {});
};

