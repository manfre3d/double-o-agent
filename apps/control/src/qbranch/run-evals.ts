import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AgentModule } from '../agent/agent.module';
import {
  AgentLoopService,
  MissionEventDraft,
  MissionRunSpec,
} from '../agent/agent-loop.service';
import { DemoLlmService } from '../agent/demo-llm.service';
import { LlmService } from '../agent/llm.service';
import { CompareInvoicesGadget } from '../gadgets/compare-invoices.gadget';
import { FlagInvoiceGadget } from '../gadgets/flag-invoice.gadget';
import { GadgetRegistry } from '../gadgets/gadget.registry';
import { SEED_INVOICES } from '../gadgets/invoices.repository';
import { ListInvoicesGadget } from '../gadgets/list-invoices.gadget';
import { ReadDocumentGadget } from '../gadgets/read-document.gadget';
import { RecordInvoiceGadget } from '../gadgets/record-invoice.gadget';
import { extractionBrief, MISSION_BRIEFS } from '../missions/mission-briefs';
import { GOLDEN_CASES, GoldenCase } from './golden';
import { CaseVerdict, failedCase, scoreExtraction, scoreHunt } from './scoring';

/**
 * Q Branch quality control: replays the golden set (golden.ts) through the
 * production briefs and agent loop, scores each debrief, and fails the run
 * below the minimum score. With no usable OPENAI_API_KEY only the
 * demo-replayable cases run — deterministic, so CI stays meaningful without
 * the secret.
 *
 * Usage: npm run eval [-- --min-score=0.8]
 */

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    AgentModule,
  ],
})
class QBranchModule {}

function buildLoop(llm: LlmService): AgentLoopService {
  const registry = new GadgetRegistry(
    new ListInvoicesGadget(),
    new CompareInvoicesGadget(),
    new FlagInvoiceGadget(),
    new ReadDocumentGadget(),
    new RecordInvoiceGadget(),
  );
  // Q Branch scores whatever brain the module resolved; run it directly (no
  // per-run demo override), passing it as both slots with liveAvailable=true.
  return new AgentLoopService(
    llm,
    llm as unknown as DemoLlmService,
    registry,
    true,
  );
}

function missionSpec(kase: GoldenCase, sequence: number): MissionRunSpec {
  const brief =
    kase.kind === 'extraction'
      ? extractionBrief({ filename: kase.filename, text: kase.text })
      : MISSION_BRIEFS['duplicate-hunt'];
  if (!brief) {
    throw new Error('The duplicate-hunt brief is missing.');
  }
  return {
    missionId: `qbranch-${sequence}`,
    code: `Q-${String(sequence).padStart(3, '0')}`,
    ...brief,
    // The hunt reads its batch from the run spec; a case without one uses the seed.
    ...(kase.kind === 'duplicate-hunt'
      ? { invoices: kase.batch ?? SEED_INVOICES }
      : {}),
  };
}

async function runCase(
  llm: LlmService,
  kase: GoldenCase,
  sequence: number,
): Promise<CaseVerdict> {
  const loop = buildLoop(llm);
  const events: MissionEventDraft[] = [];
  await loop.run(missionSpec(kase, sequence), (draft) => events.push(draft));

  const last = events.at(-1);
  if (!last || last.type !== 'debrief') {
    const detail =
      last?.type === 'error' ? last.message : 'mission ended without a debrief';
    return failedCase(kase.name, kase.kind, detail);
  }
  return kase.kind === 'extraction'
    ? scoreExtraction(kase.name, kase.expected, last.extracted)
    : scoreHunt(kase.name, kase.expectedFlagged, last.flagged);
}

function printVerdict(verdict: CaseVerdict, probes: string): void {
  const mark = verdict.pass ? 'PASS' : 'FAIL';
  console.log(`  ${mark}  ${verdict.kind.padEnd(14)} ${verdict.name}`);
  if (!verdict.pass) {
    console.log(`          guards: ${probes}`);
    for (const check of verdict.checks.filter((c) => !c.ok)) {
      console.log(`          ✘ ${check.label} — ${check.detail ?? ''}`);
    }
  }
}

function minScoreFromArgv(fallback: number): number {
  const arg = process.argv.find((a) => a.startsWith('--min-score='));
  if (!arg) {
    return fallback;
  }
  const value = Number(arg.slice('--min-score='.length));
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`Invalid --min-score: ${arg} (expected 0..1).`);
  }
  return value;
}

async function main(): Promise<number> {
  const app = await NestFactory.createApplicationContext(QBranchModule, {
    logger: ['warn', 'error'],
  });
  try {
    const llm = app.get(LlmService);
    const demoBrain = llm instanceof DemoLlmService;
    const cases = demoBrain ? GOLDEN_CASES.filter((c) => c.demo) : GOLDEN_CASES;
    // Demo replays are scripted, so anything but a perfect score is a code bug.
    const minScore = minScoreFromArgv(demoBrain ? 1 : 0.8);

    console.log('\nQ BRANCH — CONTROLLO QUALITÀ');
    console.log(
      demoBrain
        ? `Brain: scripted demo — replaying ${cases.length} of ${GOLDEN_CASES.length} golden cases (set OPENAI_API_KEY for the full set)\n`
        : `Brain: live LLM — running all ${cases.length} golden cases\n`,
    );

    const verdicts: CaseVerdict[] = [];
    for (const [index, kase] of cases.entries()) {
      const verdict = await runCase(llm, kase, index + 1);
      verdicts.push(verdict);
      printVerdict(verdict, kase.probes);
    }

    const passed = verdicts.filter((v) => v.pass).length;
    const score = passed / verdicts.length;
    const ok = score >= minScore;
    console.log(
      `\nVerdict: ${passed}/${verdicts.length} passed (${Math.round(score * 100)}%) — ` +
        `minimum ${Math.round(minScore * 100)}% → ${ok ? 'QUALITY CONTROL PASSED' : 'QUALITY CONTROL FAILED'}\n`,
    );
    return ok ? 0 : 1;
  } finally {
    await app.close();
  }
}

void main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
