import { afterEach, describe, expect, it, vi } from "vitest";
import { compressImage } from "./compress";

afterEach(() => vi.unstubAllGlobals());

function mockImageEncoding(width: number, height: number, encodedBlob: Blob) {
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: vi.fn() }),
    toBlob: (callback: BlobCallback) => callback(encodedBlob),
  };
  vi.stubGlobal("document", { createElement: () => canvas });
  vi.stubGlobal("FileReader", class {
    public onload: ((event: { target: { result: string } }) => void) | null = null;
    public readAsDataURL(): void {
      this.onload?.({ target: { result: "data:image/png;base64,test" } });
    }
  });
  vi.stubGlobal("Image", class {
    public width = width;
    public height = height;
    public onload: (() => void) | null = null;
    public set src(_source: string) {
      queueMicrotask(() => this.onload?.());
    }
  });
  return canvas;
}

describe("image compression", () => {
  it("preserves the original when WebP encoding would increase file size", async () => {
    const original = new File(["small"], "photo.png", { type: "image/png" });
    mockImageEncoding(100, 100, new Blob(["larger output"], { type: "image/webp" }));
    expect(await compressImage(original)).toBe(original);
  });

  it("fits both dimension limits while preserving aspect ratio", async () => {
    const original = new File(["original image"], "photo.png", { type: "image/png" });
    const compressed = new Blob(["webp"], { type: "image/webp" });
    const canvas = mockImageEncoding(2000, 1000, compressed);
    expect(await compressImage(original, 1600, 400)).toBe(compressed);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(400);
  });

  it("does not enlarge small images", async () => {
    const original = new File(["original image"], "photo.png", { type: "image/png" });
    const canvas = mockImageEncoding(200, 100, new Blob(["webp"], { type: "image/webp" }));
    await compressImage(original);
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
  });
});
