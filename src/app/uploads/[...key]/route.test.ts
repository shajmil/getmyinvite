import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { head } from "@vercel/blob";
import { GET } from "./route";

vi.mock("@vercel/blob", () => ({ head: vi.fn() }));

const fetchBlob = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
  vi.stubEnv("R2_PUBLIC_URL", "");
  vi.stubGlobal("fetch", fetchBlob);
  vi.mocked(head).mockResolvedValue({
    url: "https://example.public.blob.vercel-storage.com/assets/photo.jpg",
    contentType: "image/jpeg",
  } as Awaited<ReturnType<typeof head>>);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function requestPhoto() {
  return GET(new Request("https://getmyinvite.in/uploads/assets/photo.jpg"), {
    params: Promise.resolve({ key: ["assets", "photo.jpg"] }),
  });
}

describe("legacy Blob photo responses", () => {
  it("serves a recovered R2 photo at its unchanged legacy URL before trying Blob", async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://photos.r2.dev/");
    const image = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    fetchBlob.mockResolvedValue(new Response(image, { headers: { "Content-Type": "image/jpeg" } }));

    const response = await requestPhoto();

    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(image);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(fetchBlob).toHaveBeenCalledWith("https://photos.r2.dev/assets/photo.jpg");
    expect(head).not.toHaveBeenCalled();
  });

  it("falls back to Blob when the original key is absent in R2", async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://photos.r2.dev");
    fetchBlob.mockResolvedValueOnce(new Response(null, { status: 404 }));
    fetchBlob.mockResolvedValueOnce(new Response("image", { headers: { "Content-Type": "image/webp" } }));

    const response = await requestPhoto();

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("image");
    expect(head).toHaveBeenCalledWith("assets/photo.jpg");
    expect(fetchBlob).toHaveBeenCalledTimes(2);
  });

  it("preserves a Blob denial when R2 cannot serve the photo", async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://photos.r2.dev");
    fetchBlob.mockRejectedValueOnce(new Error("R2 unavailable"));
    fetchBlob.mockResolvedValueOnce(new Response("Suspended", { status: 403 }));

    const response = await requestPhoto();

    expect(response.status).toBe(403);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe("");
  });

  it.each([["_system", "upload-budget.json"], ["assets", "..", "private.env"], ["assets", "nested/photo.jpg"]])(
    "does not expose non-asset keys or traverse directories: %j", async (...key) => {
      const response = await GET(new Request("https://getmyinvite.in/uploads/invalid"), {
        params: Promise.resolve({ key }),
      });
      expect(response.status).toBe(404);
      expect(fetchBlob).not.toHaveBeenCalled();
      expect(head).not.toHaveBeenCalled();
    },
  );

  it("preserves an upstream denial without caching its error body as an image", async () => {
    fetchBlob.mockResolvedValue(new Response("Suspended store", { status: 403 }));

    const response = await requestPhoto();

    expect(response.status).toBe(403);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Type")).toBeNull();
    expect(await response.text()).toBe("");
  });

  it("streams a successful image with its existing content type and cache policy", async () => {
    const image = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    fetchBlob.mockResolvedValue(new Response(image));

    const response = await requestPhoto();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(image);
    expect(head).toHaveBeenCalledWith("assets/photo.jpg");
    expect(fetchBlob).toHaveBeenCalledWith("https://example.public.blob.vercel-storage.com/assets/photo.jpg");
  });

  it("does not cache metadata lookup failures", async () => {
    vi.mocked(head).mockRejectedValue(new Error("Blob unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await requestPhoto();

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetchBlob).not.toHaveBeenCalled();
  });
});
