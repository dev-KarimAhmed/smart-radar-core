'use client';

import React from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CarTaxiFront,
  Home,
  Languages,
  Megaphone,
  Store,
  UserRound,
} from 'lucide-react';
import { useRegistration } from '../../hooks/use-registration';
import { navigateAuth } from '@/lib/auth-routing';
import { cn } from '@/lib/utils';
import { getLandingPageUrl } from '@/lib/constants';
import { styles } from './role-step.styles';
import { copy, type Lang, type RoleKey } from './role-step.copy';
import { RoleStepCard } from './role-step-card';
import { SocialLinks } from '@/components/social-links';

export { demoUsers } from './role-step-demo-users';

const roleConfig: Array<{
  key: RoleKey;
  Icon: typeof UserRound;
  disabled?: boolean;
}> = [
  { key: 'rider', Icon: UserRound },
  { key: 'driver', Icon: CarTaxiFront },
  { key: 'advertiser', Icon: Megaphone, disabled: true },
  { key: 'delegate', Icon: Store, disabled: true },
];

export function RoleStep() {
  const { setRole, lang, setLang } = useRegistration();
  const currentLang = lang as Lang;
  const content = copy[currentLang];
  const isArabic = currentLang === 'ar';

  const handleRoleSelect = (role: RoleKey) => {
    setRole(role);
    navigateAuth('login', role);
  };

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className={styles.style260_1}
    >
      <div className={styles.style262_2} />

      <div className={cn("fixed top-4 z-40 flex items-center gap-2 sm:top-6 sm:gap-2.5", isArabic ? styles.style272_4 : styles.style272_5)}>
        <motion.button
          type="button"
          aria-label={content.ariaSwitch}
          onClick={() => setLang(isArabic ? 'en' : 'ar')}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className={styles.headerButton}
        >
          <Languages aria-hidden="true" className={styles.style275_6} />
          <span>{content.switchLabel}</span>
        </motion.button>

        <SocialLinks variant="header" isArabic={isArabic} />
      </div>

      <motion.a
        href={getLandingPageUrl()}
        aria-label={content.backToHome}
        title={content.backToHome}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className={cn(styles.style271_3, isArabic ? styles.style272_5 : styles.style272_4)}
      >
        <Home aria-hidden="true" className={styles.style275_6} />
        <span className="hidden sm:inline">{content.backToHome}</span>
        <span className="sm:hidden">{isArabic ? 'الرئيسية' : 'Home'}</span>
      </motion.a>

      <section className={styles.style279_7}>
        <div className={styles.style280_8}>
          <div className={styles.style281_9}>
            <a
              href={getLandingPageUrl()}
              className="inline-flex items-center cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Image
                src="/icons/logo-header.png"
                alt="Radar"
                width={585}
                height={152}
                priority
                className={styles.brandLogoImg}
              />
            </a>
          </div>

          <h1 className={styles.style285_11}>
            {content.title}
          </h1>

          <p className={styles.style289_12}>
            {content.subtitle}
          </p>
        </div>

        <motion.div
          layout
          className={cn(styles.style328_19, styles.style329_20)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {roleConfig.map(({ key, Icon, disabled }, index) => {
              const role = content.roles[key];

              return (
                <RoleStepCard
                  key={key}
                  roleKey={key}
                  Icon={Icon}
                  title={role.title}
                  description={role.description}
                  underDevelopmentLabel={content.underDevelopment}
                  disabled={disabled}
                  isArabic={isArabic}
                  index={index}
                  onSelect={() => handleRoleSelect(key)}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>
    </main>
  );
}
