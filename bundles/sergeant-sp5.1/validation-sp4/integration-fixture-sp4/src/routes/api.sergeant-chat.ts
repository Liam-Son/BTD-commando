import { createDualRankRouter } from "@/lib/sergeant-chat/dual_rank_router_core";
import { sanitizeSergeantDeskContext } from "@/lib/sergeant-chat/desk_context";
const router:any={resolve:async()=>({})};
async function x(body:any){
        const input = body as { message?: unknown; history?: unknown; requestId?: unknown; context?: unknown } | null;
        const message = typeof input?.message === "string" ? input.message.trim() : "";
        const supplied = typeof input?.requestId === "string" ? input.requestId.trim() : "";
        const requestId = /^[A-Za-z0-9._:-]{8,96}$/.test(supplied) ? supplied : crypto.randomUUID();
        const deskContext = sanitizeSergeantDeskContext(input?.context);
        const reply = await router.resolve(message, input?.history, requestId, deskContext);
        return reply;
}
