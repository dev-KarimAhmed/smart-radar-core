import React from 'react';
import { styles } from './history-shared';

export function HistorySkeleton() {
  return (
    <div className={styles.style361_1}>
      {[1, 2].map((i) => (
        <div key={i} className={styles.style363_2}>
          <div className={styles.style364_3}>
            <div className={styles.style365_4}>
              <div className={styles.style366_5} />
              <div className={styles.style367_6} />
            </div>
            <div className={styles.style369_7} />
          </div>
          <div className={styles.style371_8}>
            <div className={styles.style372_9} />
          </div>
        </div>
      ))}
    </div>
  );
}
