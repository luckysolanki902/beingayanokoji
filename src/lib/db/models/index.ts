/**
 * Every model in one import, so a route or action that touches three
 * collections does not open with three lines of paths.
 *
 * Importing this also guarantees the models are *registered* before any query
 * runs, mongoose resolves `ref: "User"` by name at populate time, and a model
 * that has never been imported is not registered, which fails at runtime rather
 * than at build.
 */

export { User, type UserDoc } from "./User";
export { LectureAccess, type LectureAccessDoc } from "./LectureAccess";
export { QuestionAttempt, type QuestionAttemptDoc } from "./QuestionAttempt";
export { PointEntry, POINT_REASONS, type PointEntryDoc, type PointReason } from "./PointEntry";
export { Purchase, type PurchaseDoc } from "./Purchase";
export { DestructionOrder, type DestructionOrderDoc } from "./DestructionOrder";
export { Order, type OrderDoc } from "./Order";
