import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => ({ user: { id: "test-user" } }) } },
}));

import { POST } from "./route";

function requestUpload(): Promise<Response> {
  return POST(new Request("http://localhost/api/uploads/presigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: "photo.webp", contentType: "image/webp", size: 1024 }),
  }));
}

beforeEach(() => {
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
    expect(upload.publicUrl).toMatch(/^https:\/\/assets.example.com\/assets\/test-user\//);
  });
});
