import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reserveR2UploadSpace } from "@/lib/r2-storage-limit";

vi.mock("@/lib/r2-storage-limit", () => ({ reserveR2UploadSpace: vi.fn(), R2_UPLOAD_URL_TTL_SECONDS: 900 }));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => ({ user: { id: "test-user" } }) } },
}));

import { POST } from "./route";

function requestUpload(size: unknown = 1024): Promise<Response> {
  return POST(new Request("http://localhost/api/uploads/presigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: "photo.webp", contentType: "image/webp", size }),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(reserveR2UploadSpace).mockResolvedValue(true);
  for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"]) {
    vi.stubEnv(name, "");
  }
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("upload provider selection", () => {
  it("rejects incomplete R2 settings instead of falling back to suspended Blob", async () => {
    vi.stubEnv("R2_BUCKET_NAME", "test-bucket");
    const response = await requestUpload();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "R2 uploads are not fully configured. Add all five R2 environment variables to the deployment environment and redeploy.",
    });
  });

  it("preserves the local upload flow when no R2 settings exist", async () => {
    const response = await requestUpload();
    expect(response.status).toBe(200);
    const upload = await response.json();
    expect(upload.isLocal).toBe(true);
    expect(upload.uploadUrl).toMatch(/^\/api\/uploads\/local\?key=/);
  });

  it("generates an R2 URL when all settings exist", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "test-account");
    vi.stubEnv("R2_ACCESS_KEY_ID", "test-access-key");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
    vi.stubEnv("R2_BUCKET_NAME", "test-bucket");
    vi.stubEnv("R2_PUBLIC_URL", "https://assets.example.com");
    const response = await requestUpload();
    expect(response.status).toBe(200);
    const upload = await response.json();
    expect(upload.isLocal).toBe(false);
    expect(new URL(upload.uploadUrl).hostname).toContain("test-account.r2.cloudflarestorage.com");
    expect(new URL(upload.uploadUrl).searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
    expect(new URL(upload.uploadUrl).searchParams.get("X-Amz-Expires")).toBe("900");
    expect(upload.publicUrl).toMatch(/^https:\/\/assets.example.com\/assets\/test-user\//);
  });

  it("blocks uploads when the storage budget is exhausted", async () => {
    for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"]) {
      vi.stubEnv(name, "test-setting");
    }
    vi.mocked(reserveR2UploadSpace).mockResolvedValue(false);
    expect((await requestUpload()).status).toBe(507);
  });

  it.each([0, -1, 1.5, "1024", null, 9 * 1024 * 1024])("rejects invalid upload size %s", async (size) => {
    expect((await requestUpload(size)).status).toBe(400);
    expect(reserveR2UploadSpace).not.toHaveBeenCalled();
  });
});
