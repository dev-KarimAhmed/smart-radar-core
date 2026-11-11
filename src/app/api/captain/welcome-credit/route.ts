import { NextResponse } from 'next/server';
import { grantNewCaptainWelcomeCredit } from '@/features/captain/services/captain-welcome-credit';
import { getVerifiedUser } from '@/shared/server/api-auth-guard';

export const dynamic = 'force-dynamic';

// Cutoff timestamp matching /api/auth/login email verification rollout
const EMAIL_CONFIRM_CUTOFF_MS = 1792769400000;

export async function POST(req: Request) {
  try {
    const caller = await getVerifiedUser(req);
    if (!caller) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid active session required' },
        { status: 401 }
      );
    }

    if (caller.role !== 'CAPTAIN' && caller.role !== 'DRIVER') {
      return NextResponse.json(
        { success: false, error: 'Feature only available for captains' },
        { status: 403 }
      );
    }

    const userEmail = caller.rawUser.email || (caller.rawUser.user_metadata?.email as string | undefined);
    const createdAtMs = caller.rawUser.created_at ? new Date(caller.rawUser.created_at).getTime() : 0;
    const isPreFeatureAccount = createdAtMs > 0 && createdAtMs < EMAIL_CONFIRM_CUTOFF_MS;
    const isPhoneOnlyAccount = !userEmail || !userEmail.includes('@');
    const requiresEmailConfirmation = !isPreFeatureAccount && !isPhoneOnlyAccount;

    if (requiresEmailConfirmation && !caller.rawUser.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: 'Email confirmation required before claiming welcome credit' },
        { status: 403 }
      );
    }

    const result = await grantNewCaptainWelcomeCredit(caller.id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[CaptainWelcomeCredit API] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
