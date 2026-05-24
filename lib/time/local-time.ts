export function getBrowserLocalDateTimeInputValue(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

export function getDateTimeInputValueForOffset(timezoneOffset: string, date = new Date()) {
  const offsetMinutes = parseTimezoneOffsetMinutes(timezoneOffset);
  const offsetDate = new Date(date.getTime() + offsetMinutes * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

export function getDateTimePartsForOffset(timezoneOffset: string, date = new Date()) {
  const value = getDateTimeInputValueForOffset(timezoneOffset, date);
  const [datePart = "", timePart = ""] = value.split("T");

  return {
    date: datePart,
    time: timePart.slice(0, 5),
  };
}

export function getTimestampFromDateTimeOffset(date: string, time: string, timezoneOffset: string) {
  const offsetMinutes = parseTimezoneOffsetMinutes(timezoneOffset);
  const timestamp = new Date(`${date}T${time || "00:00"}:00${formatIsoOffset(offsetMinutes)}`).getTime();

  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

export function getBrowserTimezoneOffsetMinutes(date = new Date()) {
  return -date.getTimezoneOffset();
}

export function formatTimezoneOffset(offsetMinutes: number) {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (absoluteMinutes % 60).toString().padStart(2, "0");

  return `UTC${sign}${hours}:${minutes}`;
}

export function parseTimezoneOffsetMinutes(timezoneOffset: string) {
  const normalized = timezoneOffset.trim().toUpperCase();
  const match = normalized.match(/^(?:UTC|GMT)?\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/);

  if (!match) {
    return getBrowserTimezoneOffsetMinutes();
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 14 || minutes > 59) {
    return getBrowserTimezoneOffsetMinutes();
  }

  return sign * (hours * 60 + minutes);
}

function formatIsoOffset(offsetMinutes: number) {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (absoluteMinutes % 60).toString().padStart(2, "0");

  return `${sign}${hours}:${minutes}`;
}
