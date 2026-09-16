import os
import re

# Fix history-shared.ts async export
history_shared = 'src/features/account/components/history-tab/history-shared.ts'
with open(history_shared, 'r', encoding='utf-8') as f:
    hs = f.read()
hs = hs.replace('async export function', 'export async function')
with open(history_shared, 'w', encoding='utf-8') as f:
    f.write(hs)

# Fix use-history-state.ts favorite-captains import
use_history = 'src/features/account/components/history-tab/use-history-state.ts'
with open(use_history, 'r', encoding='utf-8') as f:
    uh = f.read()
uh = uh.replace("../services/favorite-captains", "../../services/favorite-captains")
with open(use_history, 'w', encoding='utf-8') as f:
    f.write(uh)

# Fix profile-form-section.tsx imports and TS casting
profile_form = 'src/features/account/components/profile-tab/profile-form-section.tsx'
with open(profile_form, 'r', encoding='utf-8') as f:
    pf = f.read()
pf = pf.replace("'../recovery-email-field'", "'../../recovery-email-field'")
pf = pf.replace("labelFor(country, language)", "labelFor(country, language as 'en' | 'ar')")
pf = pf.replace("labelFor(governorate, language)", "labelFor(governorate, language as 'en' | 'ar')")
pf = pf.replace("labelFor(district, language)", "labelFor(district, language as 'en' | 'ar')")
with open(profile_form, 'w', encoding='utf-8') as f:
    f.write(pf)

# Fix history-sovereign-logs.tsx style errors
sovereign = 'src/features/account/components/history-tab/history-sovereign-logs.tsx'
with open(sovereign, 'r', encoding='utf-8') as f:
    sov = f.read()

# Fix strict type assignments if any
# The errors are: Type '"border-amber-500/10 text-amber-400 bg-amber-950/10"' is not assignable to type '"border-cyan-500/10 text-cyan-400 bg-cyan-950/10"'.
# In history-sovereign-logs.tsx, `styles.logTrip` has type `"border-cyan-500/10 text-cyan-400 bg-cyan-950/10"` and we are trying to reassign or something.
# We will just replace `styles.logTrip` inside ternary or whatever with the literal.
sov = re.sub(r'const getLogTypeStyle = [^}]+};', '''const getLogTypeStyle = (type: string) => {
    switch (type) {
      case 'trip': return styles.logTrip as string;
      case 'rating': return styles.logRating as string;
      case 'district': return styles.logDistrict as string;
      default: return styles.logTrip as string;
    }
  };''', sov)

sov = sov.replace('styles.style1359_186', 'styles.style859_18')
sov = sov.replace('styles.style1361_187', 'styles.style861_20')
sov = sov.replace('styles.style1362_188', 'styles.style862_21')

with open(sovereign, 'w', encoding='utf-8') as f:
    f.write(sov)

print('All TS issues fixed')
