var assert = require('chai').assert;
var watch = require('../lib/command.watch');
var cwd = require('path').resolve('test/fixtures');
var current = process.cwd();
var resolve = require('path').resolve;
var gather = require('../lib/command.copy').gatherCopyTasks;
var getBsConfig = require('../lib/utils').getBsConfig;
var cli = require("../cli");

function testCase (command, input, cb) {
    cli({input: command}, input, cb);
}

describe('Gathering run tasks', function () {
    it('can combine files to form sequence', function (done) {
        cli({
            input: ["run", "examples/tasks/simple.js", "examples/tasks/simple2.js"]
        }, {
            crossbow: {
                config: {
                    "examples/tasks/simple.js": {
                        "name": "shane"
                    }
                }
            }
        }, function (err, output) {
            assert.equal(output.sequence.length, 2);
            assert.equal(output.sequence[0].fns.length, 1);
            assert.equal(output.sequence[0].opts.name, "shane");
            done();
        });
    });
    it('can combine files to form sequence from alias', function (done) {
        cli({
            input: ["run", "js"],
            flags: {
                config: "crossbow.yaml"
            }
        }, {}, function (err, output) {
            assert.equal(output.sequence.length, 3);
            assert.equal(output.sequence[0].fns[0].name, 'simple');
            assert.equal(output.sequence[1].fns[0].name, 'simple2');
            assert.equal(output.sequence[2].fns[0].name, 'complex');
            done();
        });
    });
    it('can gather from external config file', function (done) {
        testCase(["run", "js"], {}, function (err, output) {
            if (err) {
                return done(err);
            }
            assert.equal(output.tasks.valid.length, 1);
            assert.equal(output.tasks.valid[0].subTasks.length, 0);
            done();
        })
    });
    it('can gather from external config file via flag', function (done) {
        cli({
            input: ["run", "my-awesome-task"],
            flags: {
                config: 'crossbow-alt.js'
            }
        }, {}, function (err, output) {
            if (err) {
                return done(err);
            }
            assert.equal(output.tasks.valid.length, 1);
            assert.equal(output.tasks.valid[0].subTasks.length, 0);
            assert.equal(output.tasks.valid[0].tasks.length, 2);
            assert.equal(output.tasks.valid[0].tasks[0].tasks.length, 0);
            assert.equal(output.tasks.valid[0].tasks[1].tasks.length, 0);
            done();
        })
    });
    it('can gather from external config file via flag', function (done) {
        cli({
            input: ["run", "js"],
            flags: {
                config: 'examples/crossbow.yaml'
            }
        }, {}, function (err, output) {
            assert.equal(output.tasks.valid.length, 1);
            done();
        })
    });
    it('can gather from default yaml file', function (done) {
        cli({
            input: ["run", "css"],
            flags: {
                config: 'crossbow.yaml'
            }
        }, {}, function (err, output) {
            if (err) {
                return done(err);
            }
            assert.equal(output.tasks.valid.length, 1);
            done();
        })
    });
    it('can gather simple tasks', function (done) {
        testCase(["run", "examples/tasks/simple.js:dev", "examples/tasks/simple2.js"], {
            crossbow: {
                config: {
                    sass: {
                        default: {
                            input: "scss/scss/core.scss",
                            output: "css/scss/core.css"
                        },
                        "examples/tasks/simple.js": {
                            input: "scss/scss/core.scss",
                            output: "css/scss/core.min.css"
                        }
                    }
                }
            }
        }, function (err, output) {
            assert.equal(output.tasks.valid.length, 2);
            assert.equal(output.tasks.valid[0].subTasks.length, 1);
            assert.equal(output.tasks.valid[1].subTasks.length, 0);
            done();
        })
    });
    it('can gather opts for sub tasks', function (done) {
        testCase(["run", "examples/tasks/simple.js:dev"], {
            crossbow: {
                config: {
                    "examples/tasks/simple.js": {
                        default: {
                            input: "scss/core.scss",
                            output: "css/core.css"
                        },
                        dev: {
                            input: "scss/main.scss",
                            output: "css/main.min.css"
                        }
                    }
                }
            }
        }, function (err, output) {
            if (err) {
                return done(err);
            }
            assert.equal(output.sequence[0].fns.length, 1);
            assert.equal(output.sequence[0].opts.input, 'scss/main.scss');
            assert.equal(output.sequence[0].opts.output, 'css/main.min.css');
            done();
        })
    });
    it('can gather valid tasks when using an alias', function (done) {
        testCase(["run", "css", "js"], {
            crossbow: {
                tasks: {
                    css: ['examples/tasks/simple.js', 'examples/tasks/simple2.js'],
                    js:  ['examples/tasks/simple.js']
                }
            }
        }, function (err, output) {

            var first = output.tasks.valid[0];

            assert.equal(first.taskName, 'css');
            assert.equal(first.modules.length, 0);
            assert.equal(first.tasks.length, 2);
            console.log(first.tasks);
            assert.equal(first.tasks[0].tasks.length, 0);
            assert.equal(first.tasks[0].taskName, 'examples/tasks/simple.js');
            assert.equal(first.tasks[1].taskName, 'examples/tasks/simple2.js');
            done();
        })
    });
    it.skip('can gather invalid tasks when using an alias', function (done) {
        testCase(['run', 'css', 'js'], {
            crossbow: {
                tasks: {
                    css: ['sass', 'example.js', 'jsa'],
                    js:  ['cli.js', 'lib/ctx']
                }
            }
        }, function (err, output) {
            assert.equal(output.tasks.valid.length, 1);
            assert.equal(output.tasks.invalid.length, 1);
            done();
        });
    });
});