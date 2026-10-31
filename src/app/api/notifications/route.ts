import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    let targetUserId: string | null = null;

    // 1. Authenticate via Bearer token if provided
    if (token) {
      try {
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user?.id) {
          targetUserId = authData.user.id;
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[/api/notifications] token validation error:', err);
        }
      }
    }

    // 2. Fallback to explicit userId if provided
    if (!targetUserId && typeof body.userId === 'string' && body.userId.trim().length > 0) {
      targetUserId = body.userId.trim();
    }

    const explicitUserId = typeof body.userId === 'string' && body.userId.trim().length > 0
      ? body.userId.trim()
      : null;

    const rawIds = Array.isArray(body.ids) ? body.ids : [];
    const validIds = rawIds
      .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      .map((id: string) => id.trim());

    if (!targetUserId && !explicitUserId && validIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'unauthorized_missing_user_or_ids' },
        { status: 401 }
      );
    }

    const CHUNK_SIZE = 100;
    let totalDeleted = 0;

    // 3. Clear all notifications for user
    if (body.all === true) {
      const uidsToClear = new Set<string>();
      if (targetUserId) uidsToClear.add(targetUserId);
      if (explicitUserId) uidsToClear.add(explicitUserId);

      for (const uid of uidsToClear) {
        const { error, count } = await supabaseAdmin
          .from('user_notifications')
          .delete({ count: 'exact' })
          .eq('user_id', uid);

        if (!error && count) {
          totalDeleted += count;
        }
      }

      // Also ensure any explicitly provided IDs are deleted
      if (validIds.length > 0) {
        for (let i = 0; i < validIds.length; i += CHUNK_SIZE) {
          const chunk = validIds.slice(i, i + CHUNK_SIZE);
          const { error, count } = await supabaseAdmin
            .from('user_notifications')
            .delete({ count: 'exact' })
            .in('id', chunk);

          if (!error && count) {
            totalDeleted += count;
          }
        }
      }

      return NextResponse.json({
        success: true,
        deletedCount: totalDeleted,
        clearedAll: true,
      });
    }

    // 4. Delete specific notifications by IDs
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
        .in('id', chunk);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      totalDeleted += count ?? 0;
    }

    return NextResponse.json({
      success: true,
      deletedCount: totalDeleted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'internal_server_error' },
      { status: 500 }
    );
  }
}
