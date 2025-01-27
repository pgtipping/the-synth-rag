declare module "clamscan" {
  interface ClamScanOptions {
    debugMode?: boolean;
    clamdscan: {
      host: string;
      port: number;
      timeout: number;
    };
  }

  interface ScanResult {
    isInfected: boolean;
    viruses?: string[];
  }

  interface ClamScan {
    scanBuffer(buffer: Buffer): Promise<ScanResult>;
  }

  export function createScanner(options: ClamScanOptions): ClamScan;
  export type { ClamScan, ScanResult };
}
