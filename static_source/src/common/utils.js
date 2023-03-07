import { useEffect, useLayoutEffect } from 'react';
import { intervalToDuration } from 'date-fns';

export function getDisplayDate(date1, date2, exactMode = false) {
  const diff = intervalToDuration({
    start: date1,
    end: date2,
  });
  const { years, months, days, hours, minutes, seconds } = diff;

  if (years > 0 || months > 0 || days > 0) {
    if (!exactMode) {
      if (years > 0) {
        return `${years}年前`;
      }
      if (months > 0) {
        return `${months}月前`;
      }
      if (days > 0) {
        return `${days}天前`;
      }
    } else {
      return date1.toISOString().slice(0, 10);
    }
  }

  if (hours > 0) {
    return `${hours}小时前`;
  }
  if (minutes > 0) {
    return `${minutes}分钟前`;
  }
  if (seconds > 0) {
    return `${seconds}秒前`;
  }
  return '刚刚';
}

export function isBrowser() {
  return !!(typeof window !== 'undefined' && window.document && window.document.createElement);
}

export const useIsomorphicLayoutEffect = isBrowser() ? useLayoutEffect : useEffect;
