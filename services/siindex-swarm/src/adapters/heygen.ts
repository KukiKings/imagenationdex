import type { ApprovalEvidence } from "../contracts.js";

const DEFAULT_BASE_URL = "https://api.heygen.com";

export interface HeyGenDraftInput {
  avatarId: string;
  voiceId: string;
  script: string;
  subjectId: string;
  consent: ApprovalEvidence;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export interface HeyGenVideoJob {
  status: "queued_private_draft";
  videoId: string;
  publishAuthority: "human_only";
}

export class HeyGenDraftClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = DEFAULT_BASE_URL,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    if (!apiKey) throw new Error("HEYGEN_API_KEY is required.");
  }

  async createPrivateDraft(input: HeyGenDraftInput, now = new Date()): Promise<HeyGenVideoJob> {
    if (input.consent.kind !== "subject-consent" || input.consent.subjectId !== input.subjectId) {
      throw new Error("Matching subject consent is required before rendering a digital twin.");
    }
    if (Date.parse(input.consent.expiresAt) <= now.getTime()) throw new Error("Subject consent has expired.");
    if (!input.script.trim() || input.script.length > 5_000) throw new Error("Script must contain 1 to 5000 characters.");

    const response = await this.fetchImpl(`${this.baseUrl}/v2/video/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.apiKey,
      },
      body: JSON.stringify({
        caption: false,
        dimension: dimensionFor(input.aspectRatio ?? "16:9"),
        video_inputs: [{
          character: { type: "avatar", avatar_id: input.avatarId, avatar_style: "normal" },
          voice: { type: "text", input_text: input.script, voice_id: input.voiceId },
        }],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const payload = await response.json() as { data?: { video_id?: string }; error?: { message?: string } };
    if (!response.ok || !payload.data?.video_id) {
      throw new Error(payload.error?.message ?? `HeyGen draft request failed with status ${response.status}.`);
    }
    return Object.freeze({
      status: "queued_private_draft",
      videoId: payload.data.video_id,
      publishAuthority: "human_only",
    });
  }
}

function dimensionFor(aspectRatio: NonNullable<HeyGenDraftInput["aspectRatio"]>) {
  if (aspectRatio === "9:16") return { width: 1080, height: 1920 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1920, height: 1080 };
}
