export interface Eq {
    /**
     * Return true if the other value is exactly equal to this value.
     *
     * @param other the value against which to compare.
     */
    equals(other: this): boolean;
}
export interface PartialOrd {
    /**
     * Compare this value to another, returning a relative value as documented by
     * [`Array.sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description)
     *
     * @param other the value against which to compare.
     */
    partialCompare(other: this): number;
}
export declare class Maybe {
    static of<T>(value: T | null): MaybeProvider<T>;
}
export interface MaybeProvider<T> {
    readonly isSome: boolean;
    readonly isNone: boolean;
    /**
     * Transform the mapped element and return a new {@link MaybeProvider} with the result.
     *
     * @param f the function to use
     */
    map<R>(f: (wrapped: T) => R): MaybeProvider<R>;
    flatMap<R>(f: (unwrapped: T) => MaybeProvider<R>): MaybeProvider<R>;
    get(): T;
    /**
     * Returns the some value or the provided default value.
     *
     * @param value the default value to use if this Maybe is none
     * @returns the default value or the some value
     */
    getOrElse(value: T): T;
    /**
     * Default value wrapped in MaybeProvider<T>.
     *
     * @param value the value to wrap
     * @returns a new {@link MaybeProvider}
     */
    defaulting(value: T): MaybeProvider<T>;
}
export declare class Some<T> implements MaybeProvider<T> {
    private value;
    readonly isSome: boolean;
    readonly isNone: boolean;
    private constructor();
    map<R>(f: (wrapped: T) => R): MaybeProvider<R>;
    flatMap<R>(f: (unwrapped: T) => MaybeProvider<R>): MaybeProvider<R>;
    get(): T;
    getOrElse(_value: T): T;
    defaulting(value: T): MaybeProvider<T>;
    static of<T>(value: T): MaybeProvider<T>;
}
export declare class None<T> implements MaybeProvider<T> {
    readonly isSome: boolean;
    readonly isNone: boolean;
    private constructor();
    get(): T;
    getOrElse(value: T): T;
    map<R>(_f: (_wrapped: T) => R): MaybeProvider<R>;
    flatMap<R>(_f: (_unwrapped: T) => MaybeProvider<R>): MaybeProvider<R>;
    defaulting(value: T): MaybeProvider<T>;
    static of<T>(): MaybeProvider<T>;
}
