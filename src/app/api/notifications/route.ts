import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getVerifiedUser } from '@/shared/server/api-auth-guard';

export async function DELETE(req: Request) {
  try {
    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller) {
      return NextResponse.json(
        { success: false, error: 'authentication_required' },
        { status: 401 }
      );
    }

    const targetUserId = caller.id;
    const body = await req.json().catch(() => ({}));

    const rawIds = Array.isArray(body.ids) ? body.ids : [];
    const validIds = rawIds
      .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0 && id.trim().length <= 128)
      .map((id: string) => id.trim())
      .slice(0, 500);

    const CHUNK_SIZE = 100;
    let totalDeleted = 0;

    // 1. Clear all notifications owned strictly by the verified caller
    if (body.all === true) {
      const { error, count } = await supabaseAdmin
        .from('user_notifications')
        .delete({ count: 'exact' })
        .eq('user_id', targetUserId);

      if (!error && count) {
        totalDeleted += count;
      }

      if (validIds.length > 0) {
        for (let i = 0; i < validIds.length; i += CHUNK_SIZE) {
          const chunk = validIds.slice(i, i + CHUNK_SIZE);
          const { error: chunkErr, count: chunkCount } = await supabaseAdmin
            .from('user_notifications')
            .delete({ count: 'exact' })
            .eq('user_id', targetUserId)
            .in('id', chunk);

          if (!chunkErr && chunkCount) {
            totalDeleted += chunkCount;
          }
        }
      }

      return NextResponse.json({
        success: true,
        deletedCount: totalDeleted,
        clearedAll: true,
      });
    }

    // 2. Delete specific notifications scoped strictly to caller user_id
    if (validIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'no_valid_ids_provided' },
        { status: 400 }
      );
    }

    for (let i = 0; i < validIds.length; i += CHUNK_SIZE) {
      const chunk = validIds.slice(i, i + CHUNK_SIZE);
      const { error, count } = await supabaseAdmin
        .from('user_notifications')
        .delete({ count: 'exact' })
        .eq('user_id', targetUserId)
        .in('id', chunk);

      if (error) {
        console.error('[/api/notifications] delete error:', error);
        return NextResponse.json(
          { success: false, error: 'notifications_delete_failed' },
          { status: 500 }
        );
      }

      totalDeleted += count ?? 0;
    }

    return NextResponse.json({
      success: true,
      deletedCount: totalDeleted,
    });
  } catch (error) {
    console.error('[/api/notifications] unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'internal_server_error' },
      { status: 500 }
    );
  }
}
