import "next";

declare module "next/server" {
  interface NextRequest {
    nextUrl?: URL;
  }

  type ParamCheck<T> = T extends { params: infer P }
    ? P & { [key: string]: unknown }
    : never;
}
