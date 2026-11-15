export const styles = {
  root: 'flex min-h-screen w-full flex-col bg-[#0A0F1D] text-white lg:h-screen lg:overflow-hidden',
  header: 'sticky top-0 z-[100] w-full shrink-0 lg:hidden',
  main: 'relative flex w-full flex-1 flex-col overflow-y-visible lg:h-screen lg:min-h-0 lg:overflow-hidden',
  mainShifted: 'lg:ps-[288px]',
  mainStandby: 'h-[calc(100dvh-120px)] overflow-hidden flex flex-col justify-start items-center pt-2 lg:h-full lg:justify-center lg:pt-0',
  adStage: 'relative z-[80] flex w-full flex-1 flex-col justify-start items-center pt-2 border-b-2 border-[#14B8A6]/20 shadow-[0_10px_30px_rgba(20,184,166,0.08)] lg:h-full lg:justify-center lg:pt-0',
  content: 'w-full flex-1 p-4 md:p-8',
  contentHome: 'p-0 md:p-0 lg:p-0',
  contentInner: 'min-h-0 overflow-y-auto scrollbar-thin px-0 py-4 md:px-0 md:py-6',
  contentHidden: 'hidden',
  footer: 'sticky bottom-0 z-[100] w-full shrink-0 lg:hidden',
} as const;

export const CRITICAL_RIDER_STATES = ['searching', 'busy', 'rating', 'checkpoint_required'];
