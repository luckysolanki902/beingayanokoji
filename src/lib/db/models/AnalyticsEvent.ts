import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const ANALYTICS_EVENTS = [
  "page.view",
  "page.engaged",
  "page.leave",
  "scroll.depth",
  "navigation.click",
  "outbound.click",
  "support.open",
  "auth.submit",
  "lecture.unlock_intent",
  "class.unlock_intent",
  "exam.answer",
  "shop.tier_select",
  "theme.change",
  "performance.web-vital",
] as const;

const AnalyticsEventSchema = new Schema(
  {
    event: { type: String, enum: ANALYTICS_EVENTS, required: true, index: true },
    visitorId: { type: String, required: true, maxlength: 64, index: true },
    sessionId: { type: String, required: true, maxlength: 64, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    path: { type: String, required: true, maxlength: 500, index: true },
    title: { type: String, default: null, maxlength: 300 },
    referrer: { type: String, default: null, maxlength: 1000 },
    source: { type: String, default: null, maxlength: 120 },
    medium: { type: String, default: null, maxlength: 120 },
    campaign: { type: String, default: null, maxlength: 120 },
    country: { type: String, default: null, maxlength: 8, index: true },
    device: { type: String, enum: ["mobile", "tablet", "desktop", "unknown"], default: "unknown" },
    browser: { type: String, default: null, maxlength: 40 },
    ipHash: { type: String, default: null, maxlength: 64 },
    durationMs: { type: Number, default: null, min: 0, max: 86_400_000 },
    value: { type: Number, default: null },
    label: { type: String, default: null, maxlength: 240 },
    target: { type: String, default: null, maxlength: 1000 },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AnalyticsEventSchema.index({ createdAt: -1, event: 1 });
AnalyticsEventSchema.index({ sessionId: 1, createdAt: 1 });
AnalyticsEventSchema.index({ path: 1, event: 1, createdAt: -1 });
AnalyticsEventSchema.index({ user: 1, createdAt: -1 });

export type AnalyticsEventDoc = InferSchemaType<typeof AnalyticsEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AnalyticsEvent: Model<AnalyticsEventDoc> =
  (mongoose.models.AnalyticsEvent as Model<AnalyticsEventDoc>) ??
  mongoose.model<AnalyticsEventDoc>("AnalyticsEvent", AnalyticsEventSchema);
