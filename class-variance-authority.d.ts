declare module 'class-variance-authority' {
  export type ClassValue = string | number | null | undefined | ClassValue[];
  export function cva<T extends Record<string, Record<string, string>>>(
    base: string,
    config?: {
      variants?: T;
      defaultVariants?: Partial<{ [K in keyof T]: keyof T[K] }>;
    }
  ): (props?: Partial<{ [K in keyof T]: keyof T[K] }>) => string;

  export type VariantProps<T> = T extends (props: infer P) => any ? P : never;
}
