"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const LogLevel_1 = require("../logger/LogLevel");
const AsyncScheduler_1 = require("../scheduler/AsyncScheduler");
/**
 * A task that wraps another task and ensures it is run only once,
 * regardless of how many times `run` is called.
 *
 * This allows you to implement a kind of barrier synchronization.
 */
class OnceTask {
    constructor(logger, task, dependencies) {
        this.logger = logger;
        this.task = task;
        this.dependencies = dependencies;
        // Whether we have canceled.
        this.canceled = false;
    }
    name() {
        return `${this.task.name()} (once)`;
    }
    cancel() {
        // We want to preserve one interesting property: the deepest dependency that hasn't
        // already finished or been canceled is the first to be canceled, and its failure
        // will propagate back up the promise chain.
        //
        // We can't just cancel ourselves with cancelPromise -- we will cut off the rest of
        // the tree. Nor can we necessarily do it on the same event loop tick, because the
        // cancelation might be subtly async.
        //
        // Instead, we immediately cancel each dependency, and then we cancel the current
        // task (if it's running), and then we cancel via our promise escape hatch if needed.
        /* istanbul ignore if */
        if (this.canceled) {
            return;
        }
        if (this.dependencies) {
            for (const dep of this.dependencies) {
                dep.cancel();
            }
        }
        // Do this on the next tick so that our canceled dependencies cascade.
        this.logger.info(`Canceling ${this.name()}`);
        AsyncScheduler_1.default.nextTick(() => this.task.cancel());
        this.canceled = true;
        if (this.cancelPromise) {
            AsyncScheduler_1.default.nextTick(() => this.cancelPromise(new Error(`canceling ${this.name()}`)));
        }
    }
    logDependencies() {
        if (this.logger.getLogLevel() > LogLevel_1.default.INFO) {
            return;
        }
        if (!this.dependencies) {
            return;
        }
        const names = this.dependencies
            .filter(d => d)
            .map(d => d.name())
            .join(', ');
        this.logger.info(`${this.task.name()} waiting for dependencies: ${names}`);
    }
    run() {
        if (this.promise) {
            return this.promise;
        }
        const dependencies = this.dependencies
            ? Promise.all(this.dependencies.map(d => d === null || d === void 0 ? void 0 : d.run()))
            : Promise.resolve();
        this.logDependencies();
        this.ongoing = dependencies.then(() => this.task.run());
        return (this.promise = new Promise((resolve, reject) => {
            this.cancelPromise = reject;
            this.ongoing.then(resolve).catch(reject);
        }));
    }
    setParent(parentTask) {
        this.task.setParent(parentTask);
    }
}
exports.default = OnceTask;
//# sourceMappingURL=OnceTask.js.map