import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import FileUpload from "./simple-upload";
import { useFileStore } from "@/src/lib/store";
import { useToast } from "@/src/hooks/use-toast";
import type { Mock } from "vitest";

// Mock the hooks
vi.mock("@/src/lib/store", () => ({
  useFileStore: vi.fn(),
}));

vi.mock("@/src/hooks/use-toast", () => ({
  useToast: vi.fn(),
}));

// Mock react-dropzone
vi.mock("react-dropzone", () => ({
  useDropzone: ({ onDrop }: { onDrop: (files: File[]) => void }) => ({
    getRootProps: () => ({
      onClick: vi.fn(),
      onKeyDown: vi.fn(),
      onFocus: vi.fn(),
      onBlur: vi.fn(),
      tabIndex: 0,
      role: "presentation",
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer?.files) {
          onDrop(Array.from(e.dataTransfer.files));
        }
      },
    }),
    getInputProps: () => ({
      type: "file",
      tabIndex: -1,
      style: { display: "none" },
      multiple: true,
    }),
    isDragActive: false,
  }),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;
global.URL.createObjectURL = vi.fn(() => "blob:test");
global.URL.revokeObjectURL = vi.fn();

// Mock window.matchMedia
window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe("SimpleUpload Component", () => {
  const mockAddFile = vi.fn();
  const mockRemoveFile = vi.fn();
  const mockUpdateFileStatus = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    (useFileStore as unknown as Mock).mockReturnValue({
      files: {
        test: [
          {
            id: "test-file-1",
            name: "existing.pdf",
            preview: "blob:test",
            source: "local",
            status: "completed",
          },
        ],
      },
      addFile: mockAddFile,
      removeFile: mockRemoveFile,
      updateFileStatus: mockUpdateFileStatus,
    });

    (useToast as unknown as Mock).mockReturnValue({
      toast: mockToast,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should validate CDN URL", () => {
    render(<FileUpload useCase="test" />);

    const input = screen.getByPlaceholderText("Enter CDN URL");
    const uploadButton = screen.getByText("Upload from URL");

    fireEvent.change(input, { target: { value: "invalid-url" } });
    fireEvent.click(uploadButton);

    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Please enter a valid URL",
      variant: "destructive",
    });
  });

  it("should handle CDN URL upload", () => {
    render(<FileUpload useCase="test" />);

    const input = screen.getByPlaceholderText("Enter CDN URL");
    const uploadButton = screen.getByText("Upload from URL");

    fireEvent.change(input, {
      target: { value: "https://example.com/file.pdf" },
    });
    fireEvent.click(uploadButton);

    expect(mockAddFile).toHaveBeenCalledWith(
      "test",
      expect.objectContaining({
        source: "cdn",
        cdnUrl: "https://example.com/file.pdf",
      })
    );
  });

  it("should handle file drop", async () => {
    render(<FileUpload useCase="test" />);

    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    const dropzone = screen.getByRole("presentation");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await act(async () => {
      const dropEvent = new Event("drop", { bubbles: true });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: { files: [file] },
      });
      fireEvent(dropzone, dropEvent);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockAddFile).toHaveBeenCalledWith(
      "test",
      expect.objectContaining({
        name: "test.pdf",
        source: "local",
      })
    );
  });

  it("should handle file validation failure", async () => {
    render(<FileUpload useCase="test" />);

    const file = new File(["test"], "test.exe", {
      type: "application/x-msdownload",
    });
    const dropzone = screen.getByRole("presentation");

    await act(async () => {
      const dropEvent = new Event("drop", { bubbles: true });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: { files: [file] },
      });
      fireEvent(dropzone, dropEvent);
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "File type application/x-msdownload is not supported",
      variant: "destructive",
    });
    expect(mockAddFile).not.toHaveBeenCalled();
  });

  it("should handle file size limit", async () => {
    render(<FileUpload useCase="test" />);

    const largeFile = new File(
      [new ArrayBuffer(11 * 1024 * 1024)],
      "large.pdf",
      {
        type: "application/pdf",
      }
    );
    const dropzone = screen.getByRole("presentation");

    await act(async () => {
      const dropEvent = new Event("drop", { bubbles: true });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: { files: [largeFile] },
      });
      fireEvent(dropzone, dropEvent);
      await vi.runOnlyPendingTimersAsync();
    });

    await vi.runAllTimersAsync();

    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "File size exceeds 10MB limit",
      variant: "destructive",
    });
    expect(mockAddFile).not.toHaveBeenCalled();
  });

  it("should show upload hints when provided", () => {
    const hints = {
      title: "Test Hints",
      description: "These are test hints",
      exampleFiles: ["example1.pdf", "example2.csv"],
    };

    render(<FileUpload useCase="test" uploadHints={hints} />);

    expect(screen.getByText("These are test hints")).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("example1.pdf"))
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("example2.csv"))
    ).toBeInTheDocument();
  });

  it("should handle file removal", () => {
    render(<FileUpload useCase="test" />);

    const removeButton = screen.getByLabelText("Remove file");
    fireEvent.click(removeButton);

    expect(mockRemoveFile).toHaveBeenCalledWith("test", "test-file-1");
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("should update file processing progress", async () => {
    render(<FileUpload useCase="test" />);

    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    const dropzone = screen.getByRole("presentation");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await act(async () => {
      const dropEvent = new Event("drop", { bubbles: true });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: { files: [file] },
      });
      fireEvent(dropzone, dropEvent);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockAddFile).toHaveBeenCalledWith(
      "test",
      expect.objectContaining({
        name: "test.pdf",
        source: "local",
        processingStage: expect.objectContaining({
          stage: "uploading",
          progress: 0,
          message: "Starting upload...",
        }),
      })
    );
  });

  it("should handle multiple file uploads", async () => {
    render(<FileUpload useCase="test" />);

    const files = [
      new File(["test1"], "test1.pdf", { type: "application/pdf" }),
      new File(["test2"], "test2.pdf", { type: "application/pdf" }),
    ];
    const dropzone = screen.getByRole("presentation");

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    await act(async () => {
      const dropEvent = new Event("drop", { bubbles: true });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: { files },
      });
      fireEvent(dropzone, dropEvent);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockAddFile).toHaveBeenCalledTimes(2);
  });

  it("should handle mixed valid and invalid files", async () => {
    render(<FileUpload useCase="test" />);

    const files = [
      new File(["test1"], "test1.pdf", { type: "application/pdf" }),
      new File(["test2"], "test2.exe", { type: "application/x-msdownload" }),
    ];
    const dropzone = screen.getByRole("presentation");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await act(async () => {
      const dropEvent = new Event("drop", { bubbles: true });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: { files },
      });
      fireEvent(dropzone, dropEvent);
    });

    expect(mockAddFile).toHaveBeenCalledTimes(1);
    expect(mockAddFile).toHaveBeenCalledWith(
      "test",
      expect.objectContaining({
        name: "test1.pdf",
        type: "application/pdf",
      })
    );

    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "File type application/x-msdownload is not supported",
      variant: "destructive",
    });
  });
});
