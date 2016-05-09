const assert = require('chai').assert;
const cli = require("../");
const TaskTypes = require("../dist/task.resolve").TaskTypes;
const TaskRunModes = require("../dist/task.resolve").TaskRunModes;
const SequenceItemTypes = require("../dist/task.sequence.factories").SequenceItemTypes;

describe('task.resolve (inline-functions within array)', function () {
    it('with inline functions', function () {
        const runner = cli.getRunner(['js'], {
            tasks: {
                js: [function shane() {

                }]
            }
        });
        assert.equal(runner.tasks.valid[0].runMode, TaskRunModes.series);
    });
    // it('with multiple inline functions', function () {
    //     const runner = cli.getRunner(['js'], {
    //         tasks: {
    //             js: ['shane', 'kittie'],
    //             shane: function ()  {},
    //             kittie: function () {}
    //         }
    //     });
    //     assert.equal(runner.tasks.valid[0].tasks.length, 2);
    //     assert.equal(runner.tasks.valid[0].tasks[0].type, TaskTypes.InlineFunction);
    //     assert.equal(runner.tasks.valid[0].tasks[1].type, TaskTypes.InlineFunction);
    // });
    // it('with multiple inline functions with cbflags', function () {
    //     const runner = cli.getRunner(['js@p'], {
    //         tasks: {
    //             js: ['shane', 'kittie'],
    //             shane: function ()  {},
    //             kittie: function () {}
    //         }
    //     });
    //     assert.equal(runner.tasks.valid[0].tasks.length, 2);
    //     assert.equal(runner.tasks.valid[0].runMode, TaskRunModes.parallel);
    //     assert.equal(runner.tasks.valid[0].tasks[0].type, TaskTypes.InlineFunction);
    //     assert.equal(runner.tasks.valid[0].tasks[1].type, TaskTypes.InlineFunction);
    // });
    // it('with flags', function () {
    //     const runner = cli.getRunner(['js'], {
    //         tasks: {
    //             js: ['shane --production', 'kittie?name=shane'],
    //             shane: function ()  {},
    //             kittie: function () {}
    //         }
    //     });
    //     assert.equal(runner.tasks.valid[0].tasks[0].flags.production, true);
    //     assert.equal(runner.tasks.valid[0].tasks[1].query.name, 'shane');
    // });
    // it('creates the correct sequence from tasks', function () {
    //     const runner = cli.getRunner(['js'], {
    //         tasks: {
    //             js: ['shane --production', 'kittie?name=shane'],
    //             shane: function ()  {},
    //             kittie: function () {}
    //         }
    //     });
    //     assert.equal(runner.sequence[0].type, SequenceItemTypes.SeriesGroup);
    //     assert.equal(runner.sequence[0].items.length, 2);
    // });
    // it('sends correct options from options', function () {
    //     const runner = cli.getRunner(['js:dev:kittie --production', 'test/fixtures/tasks/promise.js --name="shane"'], {
    //         options: {
    //             js: {
    //                 dev: {
    //                     name: "kittie"
    //                 },
    //                 kittie: {
    //                     name: "shane"
    //                 }
    //             }
    //         },
    //         tasks: {
    //             js: function () {
    //
    //             }
    //         }
    //     });
    //     assert.equal(runner.sequence.length, 5);
    //     assert.equal(runner.sequence[0].options.name, 'kittie');
    //     assert.equal(runner.sequence[1].options.name, 'shane');
    //     assert.equal(runner.sequence[2].options.name, 'shane');
    // });
});
