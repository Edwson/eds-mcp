/**
 * TypeScript declarations for the eds-mcp pure engine (core.js).
 * `import { createCore } from 'eds-mcp-server'` is fully typed.
 */

export type Theme = 'light' | 'dark';
export type RenderState = 'loading' | 'empty' | 'error' | 'stale';
export type ThemeFormat = 'css' | 'json' | 'scss' | 'tailwind';

export interface Tokens {
  version?: string;
  color: { light: Record<string, string>; dark: Record<string, string> };
  space: Record<string, string>;
  radius: Record<string, string>;
  density: Record<string, string>;
  type: { mono?: string; font?: string; scale?: Record<string, string> };
}

export interface ComponentContract {
  purpose: string;
  whenToUse: string;
  whenNot: string;
  props: Record<string, string>;
  a11y: string;
  regulatory: string[];
  tokens: string[];
  dataContract: { shape?: string; states: RenderState[] };
  domain: string;
  requires?: string[];
  nonRemovable?: boolean;
}

export interface Manifest {
  version?: string;
  files?: Record<string, { sha256: string; bytes?: number }>;
  summary?: { components?: number; domains?: string[]; [k: string]: unknown };
  [k: string]: unknown;
}

export interface CoreData {
  tokens: Tokens;
  components: { components: Record<string, ComponentContract> } | Record<string, ComponentContract>;
  manifest?: Manifest;
}

export interface ResolvedToken { group: string; name: string; value: unknown; }
export interface ScaffoldResult {
  id: string; prefix: string; sectionId: string; tokensUsed: string[]; states: RenderState[];
  regulatory: string[]; requires: string[]; files: { html: string; css: string; js: string }; notes: string;
}
export interface LintIssue { severity: 'error' | 'warn'; code: string; message: string; }
export interface LintResult { ok: boolean; issues: LintIssue[]; }
export interface BundleResult { requested: string[]; order: string[]; missing: string[]; tokens: string[]; regulatory: string[]; count: number; }
export interface MethodResult { version: string; nonNegotiables: string[]; verificationGates: string[]; canonicalStates: RenderState[]; note: string; }

/** A value with an `error` is the failure shape; methods never throw across the boundary. */
export type Result<T> = T | { error: string;[k: string]: unknown };

export interface Core {
  readonly version: string;
  readonly CANON_STATES: RenderState[];
  // tokens + theme
  listTokenGroups(): { groups: string[]; version: string };
  getTokens(group: string, theme?: Theme): Result<{ group: string; theme?: Theme; tokens: unknown }>;
  getToken(name: string, theme?: Theme): Result<{ name: string; group: string; cssVar: string | null; value: unknown }>;
  resolveToken(name: string, theme?: Theme): ResolvedToken | null;
  tokenKnown(name: string): boolean;
  cssVarFor(name: string): string | null;
  exportTheme(format: ThemeFormat): Result<{ format: string; output: unknown }>;
  // components
  listComponents(domain?: string): { domain: string | null; count: number; domains: string[]; components: unknown[] };
  getComponent(id: string): Result<{ id: string } & ComponentContract>;
  getDataContract(id: string): Result<{ id: string; dataContract: ComponentContract['dataContract'] | null }>;
  getDecisionRegister(id: string): Result<{ id: string; register: { whenToUse: string | null; whenNot: string | null; behaviourAndA11y: string | null; regulatory: string[] } }>;
  searchComponents(query: string): { query: string; count: number; results: Array<{ id: string; domain: string | null; purpose: string; score: number }> };
  findByRegulation(rule: string): Result<{ rule: string; count: number; results: unknown[] }>;
  recommend(useCase: string, limit?: number): Result<{ useCase: string; count: number; recommendations: unknown[] }>;
  bundle(ids: string[] | string): BundleResult;
  // generation + checks
  scaffoldComponent(id: string): Result<ScaffoldResult>;
  lintUsage(input: { tokens?: string[]; states?: string[]; css?: string }): LintResult;
  // meta
  getManifest(): Manifest;
  diffSince(version: string): { consumerVersion: string; currentVersion: string; upToDate: boolean; changedFiles: string[]; checksums: Record<string, unknown> };
  getMethod(): MethodResult;
  getStats(): { version: string; components: number; domains: Record<string, number>; regulatoryFrameworks: number; tokens: number; canonicalStates: RenderState[] };
  summarize(id: string, c: ComponentContract): unknown;
  domainCounts(): Record<string, number>;
}

export function createCore(data: CoreData): Core;
export const CANON_STATES: RenderState[];
export const NON_NEGOTIABLES: string[];
export const VERIFICATION_GATES: string[];
