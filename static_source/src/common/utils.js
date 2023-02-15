import { intervalToDuration } from 'date-fns';

export function getTimeDiffStr(date1, date2) {
  const diff = intervalToDuration({
    start: date1,
    end: date2,
  });
  const { years, months, days, hours, minutes, seconds } = diff;
  if (years > 0) {
    return `${years}年前`;
  }
  if (months > 0) {
    return `${months}月前`;
  }
  if (days > 0) {
    return `${days}天前`;
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
