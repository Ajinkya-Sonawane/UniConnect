import Logger from '../logger/Logger';
import OnceTask from './OnceTask';
import Task from './Task';
import TaskStatus from './TaskStatus';
export default abstract class BaseTask implements Task {
    protected logger: Logger;
    protected taskName: string;
    private parentTask;
    private status;
    abstract run(): Promise<void>;
    constructor(logger: Logger);
    once(...dependencies: (Task | undefined)[]): OnceTask;
    cancel(): void;
    name(): string;
    setParent(parentTask: Task): void;
    protected getStatus(): TaskStatus;
    protected logAndThrow(message: string): void;
    private baseRun;
    private baseCancel;
}
