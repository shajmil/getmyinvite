import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { head } from "@vercel/blob";
import { GET } from "./route";

vi.mock("@vercel/blob", () => ({ head: vi.fn() }));

const fetchBlob = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-blob-token");
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
