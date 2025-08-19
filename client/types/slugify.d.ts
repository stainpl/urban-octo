declare module "slugify" {
  export interface Options {
    replacement?: string;
    remove?: RegExp;
    lower?: boolean;
    strict?: boolean;
    locale?: string;
    trim?: boolean;
  }

  export default function slugify(
    input: string,
    options?: Options
  ): string;
}
