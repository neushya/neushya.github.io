/**
 * FileSystemService.ts
 * Browser-native File System Access API abstraction for Zenito MD Web.
 */

export interface FileEntry {
  name: string;
  kind: 'file' | 'directory';
  handle: FileSystemHandle;
}

class FileSystemService {
  /**
   * Open a directory picker and return the handle
   */
  async openDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      return handle;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null;
      throw err;
    }
  }

  /**
   * Recursively list entries in a directory handle
   */
  async getDirectoryEntries(directoryHandle: FileSystemDirectoryHandle): Promise<FileEntry[]> {
    const entries: FileEntry[] = [];
    for await (const entry of directoryHandle.values()) {
      entries.push({
        name: entry.name,
        kind: entry.kind,
        handle: entry
      });
    }
    // Sort: directories first, then files
    return entries.sort((a, b) => {
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === 'directory' ? -1 : 1;
    });
  }

  /**
   * Read text content from a file handle
   */
  async readFile(fileHandle: FileSystemFileHandle): Promise<string> {
    const file = await fileHandle.getFile();
    return await file.text();
  }

  /**
   * Write text content to a file handle
   */
  async writeFile(fileHandle: FileSystemFileHandle, content: string): Promise<void> {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * Request permission for a handle (used for re-authorization)
   */
  async verifyPermission(handle: FileSystemHandle, readWrite: boolean = true): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = {
      mode: readWrite ? 'readwrite' : 'read'
    };
    if ((await handle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await handle.requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  }
}

export const fileSystemService = new FileSystemService();
