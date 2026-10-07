import { corporalReply, type CorporalReply } from './corporal_engine';
import { sanitizeSergeantDeskContext, type SergeantDeskContext } from './desk_context';
export type SergeantReply=any;
function sanitizeHistory(x:unknown):any[]{return []}
export class DualRankRouter {
  async resolve(message: string, history: unknown, requestId?: string, context?: unknown): Promise<SergeantReply | CorporalReply> {
    const q = String(message ?? '').trim();
    const safeHistory = sanitizeHistory(history);
    const safeContext: SergeantDeskContext | null = sanitizeSergeantDeskContext(context);
    const local = corporalReply(q, safeContext);
    const r = await fetch("https://example.test/chat", {
          method: 'POST',
          headers: {},
          body: JSON.stringify({
            message: q,
            history: safeHistory,
            deskContext: safeContext,
            constraints: {
              paperOnly: true,
              noBroker: true,
              noPortfolioMutation: true,
              deterministicRiskAuthoritative: true,
            },
          }),
        });
    return local;
  }
}
