/**
 * The refusal sentinel.
 *
 * It lives in its own module because two things need it that must not import
 * each other: the engine, which scores a refusal below silence, and the cost
 * reader, which the engine calls. A cycle between those two would put the
 * sentinel's initialisation order at the mercy of whichever module the bundler
 * reached first, and the string would be `undefined` for exactly one of them.
 *
 * `engine.ts` re-exports both, so every existing `from "./engine"` import keeps
 * working and there is still one definition.
 */
export const NO_ANSWER = "◇ Asked — no answer given";

export const isNoAnswer = (v: string) => v.trim() === NO_ANSWER;
