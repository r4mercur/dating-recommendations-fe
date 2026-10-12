/** Profile rules shared by registration and profile editing, mirroring the backend validation. */

export const GENDERS = [
    {label: 'Male', value: 'MALE'},
    {label: 'Female', value: 'FEMALE'},
    {label: 'Diverse', value: 'DIVERSE'},
];

export const MIN_AGE = 18;
export const MAX_AGE = 99;
export const BIO_MAX_LENGTH = 1000;
export const MAX_TAGS_PER_CATEGORY = 20;
export const PASSWORD_MIN_LENGTH = 8;
export const MAX_DISTANCE_KM = 500;
export const MAX_SONGS = 4;
export const MAX_GAMES = 6;

export function genderLabel(value) {
    return GENDERS.find(gender => gender.value === value)?.label ?? value;
}

/** Latest birth date that is still old enough. */
export function latestBirthDate() {
    const date = new Date();
    date.setFullYear(date.getFullYear() - MIN_AGE);
    return date;
}

/** Date as yyyy-MM-dd in local time, the format the backend expects for LocalDate. */
export function toIsoDate(date) {
    if (!date) return null;
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromIsoDate(value) {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}
